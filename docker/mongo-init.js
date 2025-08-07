// MongoDB initialization script for Crown application

// Create application database
db = db.getSiblingDB('crown');

// Create application user
db.createUser({
  user: 'crown_app',
  pwd: 'crown_app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'crown'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        createdAt: {
          bsonType: 'date'
        },
        lastActive: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('posts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'content', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'objectId'
        },
        content: {
          bsonType: 'string',
          maxLength: 2000
        },
        images: {
          bsonType: 'array',
          maxItems: 4
        },
        likes: {
          bsonType: 'array'
        },
        comments: {
          bsonType: 'array'
        },
        createdAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for performance
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'username': 1 }, { unique: true });
db.users.createIndex({ 'createdAt': 1 });
db.users.createIndex({ 'lastActive': 1 });

db.posts.createIndex({ 'userId': 1 });
db.posts.createIndex({ 'createdAt': -1 });
db.posts.createIndex({ 'likes': 1 });

print('Crown database initialized successfully');
