// ═══════════════════════════════════════════════════════════════
// CAREQ PHASE 2 - RESOURCE MANAGEMENT API
// ═══════════════════════════════════════════════════════════════
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const logActivity = (action, data, callback) => {
  const id = uuidv4();
  const metadata = JSON.stringify(data.metadata || {});
  
  db.run(
    `INSERT INTO activity_log (id, action, performed_by, patient_id, patient_name, resource_id, resource_name, bed_id, metadata) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, action, data.performed_by, data.patient_id, data.patient_name, data.resource_id, data.resource_name, data.bed_id, metadata],
    callback
  );
};

// ═══════════════════════════════════════════════════════════════
// RESOURCE ROUTES
// ═══════════════════════════════════════════════════════════════

const setupResourceRoutes = (app, io, authenticate) => {

  // ─────────────────────────────────────────────────────────────
  // GET /api/resources - List all resources
  // ─────────────────────────────────────────────────────────────
  app.get('/api/resources', authenticate, (req, res) => {
    const { type, status, supports_slots, search } = req.query;
    
    let query = 'SELECT * FROM resources WHERE 1=1';
    const params = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (supports_slots !== undefined) {
      query += ' AND supports_slots = ?';
      params.push(supports_slots === 'true' ? 1 : 0);
    }
    if (search) {
      query += ' AND (name LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY type, name';
    
    db.all(query, params, (err, resources) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Parse metadata JSON for each resource and extract capacity info
      const parsed = resources.map(r => {
        const metadata = r.metadata ? JSON.parse(r.metadata) : {};
        return {
          ...r,
          metadata,
          supports_slots: Boolean(r.supports_slots),
          // Extract capacity from metadata if available
          total_capacity: metadata.total_capacity || null,
          current_occupied: metadata.current_occupied || 0,
          units_available: metadata.units_available || null,
          last_updated_at: r.updated_at
        };
      });
      
      res.json(parsed);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/resources/:id - Get single resource with details
  // ─────────────────────────────────────────────────────────────
  app.get('/api/resources/:id', authenticate, (req, res) => {
    db.get('SELECT * FROM resources WHERE id = ?', [req.params.id], (err, resource) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!resource) return res.status(404).json({ error: 'Resource not found' });
      
      resource.metadata = resource.metadata ? JSON.parse(resource.metadata) : {};
      resource.supports_slots = Boolean(resource.supports_slots);
      
      // Get active assignment if exists
      db.get(
        'SELECT * FROM resource_assignments WHERE resource_id = ? AND status = "active" ORDER BY start_time DESC LIMIT 1',
        [req.params.id],
        (err, assignment) => {
          resource.current_assignment = assignment || null;
          
          // Get today's slots if supports_slots
          if (resource.supports_slots) {
            const today = new Date().toISOString().split('T')[0];
            db.all(
              'SELECT * FROM resource_slots WHERE resource_id = ? AND slot_date = ? ORDER BY start_time',
              [req.params.id, today],
              (err, slots) => {
                resource.today_slots = slots || [];
                res.json(resource);
              }
            );
          } else {
            res.json(resource);
          }
        }
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/resources - Create new resource (Admin only)
  // ─────────────────────────────────────────────────────────────
  app.post('/api/resources', authenticate, (req, res) => {
    const { name, type, subtype, location, metadata, supports_slots } = req.body;
    const id = uuidv4();
    
    db.run(
      `INSERT INTO resources (id, name, type, subtype, status, location, metadata, supports_slots) 
       VALUES (?, ?, ?, ?, 'available', ?, ?, ?)`,
      [id, name, type, subtype, location, JSON.stringify(metadata || {}), supports_slots ? 1 : 0],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        logActivity('resource_created', {
          performed_by: req.user?.id || 'system',
          resource_id: id,
          resource_name: name,
          metadata: { type, subtype }
        });
        
        io.emit('resource:created', { id, name, type, status: 'available' });
        res.json({ success: true, id });
      }
    );
  });

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/resources/:id/status - Update resource status or occupancy
  // ─────────────────────────────────────────────────────────────
  app.patch('/api/resources/:id/status', authenticate, (req, res) => {
    const { status, current_occupied } = req.body;
    
    // First get the current resource
    db.get('SELECT * FROM resources WHERE id = ?', [req.params.id], (err, resource) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!resource) return res.status(404).json({ error: 'Resource not found' });
      
      const metadata = resource.metadata ? JSON.parse(resource.metadata) : {};
      
      // Update metadata if current_occupied is provided
      if (current_occupied !== undefined) {
        metadata.current_occupied = parseInt(current_occupied);
        
        // Calculate units_available if total_capacity exists
        if (metadata.total_capacity) {
          metadata.units_available = metadata.total_capacity - metadata.current_occupied;
        }
      }
      
      // Determine new status
      let newStatus = status || resource.status;
      
      // Auto-calculate status based on occupancy if not explicitly provided
      if (!status && metadata.total_capacity && current_occupied !== undefined) {
        const percentage = ((metadata.total_capacity - metadata.current_occupied) / metadata.total_capacity) * 100;
        if (percentage >= 80) newStatus = 'available';
        else if (percentage >= 20) newStatus = 'limited';
        else newStatus = 'full';
      }
      
      // Update database
      db.run(
        'UPDATE resources SET status = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, JSON.stringify(metadata), req.params.id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          logActivity('resource_status_changed', {
            performed_by: req.user?.id || 'system',
            resource_id: resource.id,
            resource_name: resource.name,
            metadata: { old_status: resource.status, new_status: newStatus, current_occupied: metadata.current_occupied }
          });
          
          io.emit('resource:updated', {
            id: resource.id,
            name: resource.name,
            type: resource.type,
            status: newStatus,
            metadata
          });
          
          res.json({ success: true, status: newStatus, metadata });
        }
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/assign-resource - Assign resource to patient
  // ─────────────────────────────────────────────────────────────
  app.post('/api/assign-resource', authenticate, (req, res) => {
    const { resource_id, patient_id, patient_name, notes, is_emergency } = req.body;
    
    // Check if resource exists and supports_slots is false
    db.get('SELECT * FROM resources WHERE id = ?', [resource_id], (err, resource) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!resource) return res.status(404).json({ error: 'Resource not found' });
      
      if (resource.supports_slots) {
        return res.status(400).json({ error: 'This resource uses slot booking. Use /book-slot instead.' });
      }
      
      // Check availability (skip if emergency)
      if (!is_emergency && resource.status !== 'available') {
        return res.status(400).json({ error: 'Resource is not available' });
      }
      
      // Check for existing active assignment
      db.get(
        'SELECT * FROM resource_assignments WHERE resource_id = ? AND status = "active"',
        [resource_id],
        (err, existing) => {
          if (existing && !is_emergency) {
            return res.status(400).json({ error: 'Resource already has an active assignment' });
          }
          
          const assignment_id = uuidv4();
          const staffId = req.user?.id || 'system';
          
          // Create assignment
          db.run(
            `INSERT INTO resource_assignments (id, resource_id, patient_id, patient_name, assigned_by, status, is_emergency, notes) 
             VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
            [assignment_id, resource_id, patient_id, patient_name, staffId, is_emergency ? 1 : 0, notes],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              
              // Update resource status
              db.run('UPDATE resources SET status = "occupied" WHERE id = ?', [resource_id]);
              
              // Log activity
              logActivity(is_emergency ? 'resource_emergency_override' : 'resource_assigned', {
                performed_by: staffId,
                resource_id,
                resource_name: resource.name,
                patient_id,
                patient_name,
                metadata: { notes, is_emergency }
              });
              
              // Emit events
              io.emit('resource:updated', {
                id: resource.id,
                name: resource.name,
                type: resource.type,
                status: 'occupied'
              });
              
              io.emit('resource:assigned', {
                assignment_id,
                resource: { id: resource.id, name: resource.name, type: resource.type },
                patient: { id: patient_id, name: patient_name },
                is_emergency
              });
              
              if (is_emergency) {
                io.emit('emergency:alert', {
                  message: `Emergency override: ${resource.name} assigned to ${patient_name}`,
                  resource_id,
                  patient_id
                });
              }
              
              res.json({ success: true, assignment_id });
            }
          );
        }
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/release-resource - Release resource
  // ─────────────────────────────────────────────────────────────
  app.post('/api/release-resource', authenticate, (req, res) => {
    const { resource_id, notes } = req.body;
    
    // Find active assignment
    db.get(
      'SELECT * FROM resource_assignments WHERE resource_id = ? AND status = "active"',
      [resource_id],
      (err, assignment) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!assignment) return res.status(404).json({ error: 'No active assignment found' });
        
        // Complete assignment
        db.run(
          'UPDATE resource_assignments SET status = "completed", end_time = CURRENT_TIMESTAMP WHERE id = ?',
          [assignment.id],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Update resource status
            db.run('UPDATE resources SET status = "available" WHERE id = ?', [resource_id]);
            
            // Get resource details
            db.get('SELECT * FROM resources WHERE id = ?', [resource_id], (err, resource) => {
              if (resource) {
                logActivity('resource_released', {
                  performed_by: req.user?.id || 'system',
                  resource_id,
                  resource_name: resource.name,
                  patient_id: assignment.patient_id,
                  patient_name: assignment.patient_name,
                  metadata: { notes }
                });
                
                io.emit('resource:updated', {
                  id: resource.id,
                  name: resource.name,
                  type: resource.type,
                  status: 'available'
                });
                
                io.emit('resource:released', {
                  resource_id,
                  patient_id: assignment.patient_id
                });
              }
              
              res.json({ success: true });
            });
          }
        );
      }
    );
  });

  // ─────────────────────────────────────────────────────────────
  // SLOT BOOKING ROUTES
  // ─────────────────────────────────────────────────────────────

  // GET /api/slots - Get slots for a resource on a date
  app.get('/api/slots', authenticate, (req, res) => {
    const { resource_id, date } = req.query;
    
    if (!resource_id || !date) {
      return res.status(400).json({ error: 'resource_id and date are required' });
    }
    
    db.all(
      'SELECT * FROM resource_slots WHERE resource_id = ? AND slot_date = ? ORDER BY start_time',
      [resource_id, date],
      (err, slots) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(slots || []);
      }
    );
  });

  // POST /api/slots/generate - Generate slots for a day (Admin only)
  app.post('/api/slots/generate', authenticate, (req, res) => {
    const { resource_id, date, start_hour, end_hour, slot_duration_mins } = req.body;
    
    // Validate resource supports slots
    db.get('SELECT * FROM resources WHERE id = ?', [resource_id], (err, resource) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!resource) return res.status(404).json({ error: 'Resource not found' });
      if (!resource.supports_slots) {
        return res.status(400).json({ error: 'This resource does not support slot booking' });
      }
      
      // Generate time slots
      const slots = [];
      let currentHour = start_hour;
      let currentMin = 0;
      
      while (currentHour < end_hour || (currentHour === end_hour && currentMin === 0)) {
        const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        currentMin += slot_duration_mins;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
        const endTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        if (currentHour < end_hour || (currentHour === end_hour && currentMin === 0)) {
          slots.push({
            id: uuidv4(),
            resource_id,
            slot_date: date,
            start_time: startTime,
            end_time: endTime,
            status: 'available'
          });
        }
      }
      
      // Insert slots
      const stmt = db.prepare(
        'INSERT INTO resource_slots (id, resource_id, slot_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)'
      );
      
      slots.forEach(slot => {
        stmt.run(slot.id, slot.resource_id, slot.slot_date, slot.start_time, slot.end_time, slot.status);
      });
      
      stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        logActivity('slots_generated', {
          performed_by: req.user?.id || 'system',
          resource_id,
          resource_name: resource.name,
          metadata: { date, count: slots.length }
        });
        
        res.json({ success: true, count: slots.length, slots });
      });
    });
  });

  // POST /api/book-slot - Book a slot
  app.post('/api/book-slot', authenticate, (req, res) => {
    const { slot_id, patient_id, patient_name, notes } = req.body;
    
    // Check slot availability
    db.get('SELECT * FROM resource_slots WHERE id = ?', [slot_id], (err, slot) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!slot) return res.status(404).json({ error: 'Slot not found' });
      if (slot.status !== 'available') {
        return res.status(400).json({ error: 'Slot is not available' });
      }
      
      const staffId = req.user?.id || 'system';
      
      // Book slot
      db.run(
        'UPDATE resource_slots SET status = "booked", patient_id = ?, patient_name = ?, booked_by = ? WHERE id = ?',
        [patient_id, patient_name, staffId, slot_id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          // Get resource details
          db.get('SELECT * FROM resources WHERE id = ?', [slot.resource_id], (err, resource) => {
            if (resource) {
              logActivity('slot_booked', {
                performed_by: staffId,
                resource_id: resource.id,
                resource_name: resource.name,
                patient_id,
                patient_name,
                metadata: { slot_date: slot.slot_date, start_time: slot.start_time, notes }
              });
              
              io.emit('slot:updated', {
                slot_id,
                resource_id: resource.id,
                status: 'booked',
                patient_id,
                patient_name,
                start_time: slot.start_time
              });
            }
            
            res.json({ success: true });
          });
        }
      );
    });
  });

  // POST /api/cancel-slot - Cancel a booked slot
  app.post('/api/cancel-slot', authenticate, (req, res) => {
    const { slot_id, reason } = req.body;
    
    db.get('SELECT * FROM resource_slots WHERE id = ?', [slot_id], (err, slot) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!slot) return res.status(404).json({ error: 'Slot not found' });
      
      const previousPatient = { id: slot.patient_id, name: slot.patient_name };
      
      db.run(
        'UPDATE resource_slots SET status = "available", patient_id = NULL, patient_name = NULL, booked_by = NULL WHERE id = ?',
        [slot_id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          db.get('SELECT * FROM resources WHERE id = ?', [slot.resource_id], (err, resource) => {
            if (resource) {
              logActivity('slot_cancelled', {
                performed_by: req.user?.id || 'system',
                resource_id: resource.id,
                resource_name: resource.name,
                patient_id: previousPatient.id,
                patient_name: previousPatient.name,
                metadata: { slot_date: slot.slot_date, start_time: slot.start_time, reason }
              });
              
              io.emit('slot:updated', {
                slot_id,
                resource_id: resource.id,
                status: 'available',
                patient_id: null,
                start_time: slot.start_time
              });
            }
            
            res.json({ success: true });
          });
        }
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ACTIVITY LOG ROUTES
  // ─────────────────────────────────────────────────────────────

  // GET /api/activity-log - Get activity log with filters
  app.get('/api/activity-log', authenticate, (req, res) => {
    const { page = 1, limit = 50, action, staff_id, patient_id, resource_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM activity_log WHERE 1=1';
    const params = [];
    
    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (staff_id) {
      query += ' AND performed_by = ?';
      params.push(staff_id);
    }
    if (patient_id) {
      query += ' AND patient_id = ?';
      params.push(patient_id);
    }
    if (resource_id) {
      query += ' AND resource_id = ?';
      params.push(resource_id);
    }
    if (date_from) {
      query += ' AND created_at >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND created_at <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, logs) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Parse metadata
      const parsed = logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : {}
      }));
      
      res.json(parsed);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ANALYTICS ROUTES
  // ─────────────────────────────────────────────────────────────

  // GET /api/resource-usage - Get resource utilization stats
  app.get('/api/resource-usage', authenticate, (req, res) => {
    const { type, date_from, date_to } = req.query;
    
    // Get total resources by type
    db.all('SELECT type, COUNT(*) as total FROM resources GROUP BY type', (err, totals) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Get occupied resources by type
      db.all('SELECT type, COUNT(*) as occupied FROM resources WHERE status = "occupied" GROUP BY type', (err, occupied) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const occupiedMap = {};
        occupied.forEach(o => occupiedMap[o.type] = o.occupied);
        
        const by_type = {};
        totals.forEach(t => {
          const occ = occupiedMap[t.type] || 0;
          by_type[t.type] = {
            total: t.total,
            occupied: occ,
            available: t.total - occ,
            utilization_percent: ((occ / t.total) * 100).toFixed(1)
          };
        });
        
        // Calculate overall utilization
        const totalAll = totals.reduce((sum, t) => sum + t.total, 0);
        const occupiedAll = Object.values(occupiedMap).reduce((sum, o) => sum + o, 0);
        
        res.json({
          utilization_percent: ((occupiedAll / totalAll) * 100).toFixed(1),
          total_resources: totalAll,
          occupied_resources: occupiedAll,
          available_resources: totalAll - occupiedAll,
          by_type
        });
      });
    });
  });

};

module.exports = { setupResourceRoutes, logActivity };
