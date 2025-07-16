const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);
  
  // Insert seed entries
  await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@konverse.com',
      name: 'Admin User',
      password_hash: adminPassword,
      role: 'admin',
      permissions: ['flows:create', 'flows:read', 'flows:update', 'flows:delete', 'templates:manage', 'users:manage'],
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'user@konverse.com',
      name: 'Regular User',
      password_hash: userPassword,
      role: 'user',
      permissions: ['flows:create', 'flows:read', 'flows:update', 'templates:read'],
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};