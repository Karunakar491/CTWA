// MongoDB initialization script
db = db.getSiblingDB('whatsapp_flows_library');

// Create templates collection
db.createCollection('templates', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'category', 'flowDefinition', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Template name is required'
        },
        description: {
          bsonType: 'string',
          description: 'Template description is required'
        },
        category: {
          bsonType: 'string',
          description: 'Template category is required'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        },
        flowDefinition: {
          bsonType: 'object',
          description: 'Flow definition is required'
        },
        previewImage: {
          bsonType: 'string'
        },
        isPublic: {
          bsonType: 'bool'
        },
        usageCount: {
          bsonType: 'int',
          minimum: 0
        },
        rating: {
          bsonType: 'double',
          minimum: 0,
          maximum: 5
        },
        createdBy: {
          bsonType: 'string',
          description: 'Creator user ID is required'
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for templates
db.templates.createIndex({ name: 'text', description: 'text', tags: 'text' });
db.templates.createIndex({ category: 1 });
db.templates.createIndex({ tags: 1 });
db.templates.createIndex({ isPublic: 1 });
db.templates.createIndex({ usageCount: -1 });
db.templates.createIndex({ rating: -1 });
db.templates.createIndex({ createdBy: 1 });
db.templates.createIndex({ createdAt: -1 });

// Create template reviews collection
db.createCollection('template_reviews', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['templateId', 'userId', 'rating'],
      properties: {
        templateId: {
          bsonType: 'objectId',
          description: 'Template ID is required'
        },
        userId: {
          bsonType: 'string',
          description: 'User ID is required'
        },
        rating: {
          bsonType: 'int',
          minimum: 1,
          maximum: 5,
          description: 'Rating must be between 1 and 5'
        },
        comment: {
          bsonType: 'string'
        },
        createdAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for reviews
db.template_reviews.createIndex({ templateId: 1 });
db.template_reviews.createIndex({ userId: 1 });
db.template_reviews.createIndex({ templateId: 1, userId: 1 }, { unique: true });

// Create component definitions collection
db.createCollection('component_definitions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'label', 'category', 'supportedVersions'],
      properties: {
        type: {
          bsonType: 'string',
          description: 'Component type is required'
        },
        label: {
          bsonType: 'string',
          description: 'Component label is required'
        },
        category: {
          bsonType: 'string',
          description: 'Component category is required'
        },
        description: {
          bsonType: 'string'
        },
        supportedVersions: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Supported versions array is required'
        },
        properties: {
          bsonType: 'array'
        },
        constraints: {
          bsonType: 'array'
        },
        isNew: {
          bsonType: 'bool'
        },
        deprecated: {
          bsonType: 'bool'
        }
      }
    }
  }
});

// Create indexes for component definitions
db.component_definitions.createIndex({ type: 1 }, { unique: true });
db.component_definitions.createIndex({ category: 1 });
db.component_definitions.createIndex({ supportedVersions: 1 });

print('MongoDB collections and indexes created successfully');