// MongoDB initialization script
db = db.getSiblingDB('newshub');

// Create admin user
db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [{ role: 'readWriteAnyDatabase', db: 'admin' }, { role: 'dbAdmin', db: 'admin' }]
});

// Create application user with limited permissions
db.createUser({
  user: 'newshub_app',
  pwd: 'app_password',
  roles: [{ role: 'readWrite', db: 'newshub' }]
});

print('Database users created successfully');