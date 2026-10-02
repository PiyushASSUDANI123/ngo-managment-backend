require('dotenv').config();
const mongoose = require('mongoose');
const Field = require('./models/Field');
const PointsCategory = require('./models/PointsCategory');
const Volunteer = require('./models/Volunteer');
const Points = require('./models/Points');
const bcrypt = require('bcryptjs');

const fields = ["Writing", "Finance", "Social Media", "HR", "Event Planning", "Marketing"];
const categories = ["Followers", "Volunteer", "Task-1", "Spamming {September}", "Meeting{27/06/26}"];

const data = [
  { name: "Deepit [HOD]", field: "Writing", points: { "Followers": 9, "Volunteer": 2, "Task-1": 1, "Spamming {September}": 9, "Meeting{27/06/26}": 1 } },
  { name: "Anshika Goyal", field: "Writing", points: { "Followers": 5, "Volunteer": 4, "Task-1": 1, "Spamming {September}": 17, "Meeting{27/06/26}": 0 } },
  { name: "Anwesha", field: "Writing", points: { "Followers": 6, "Meeting{27/06/26}": 1 } },
  { name: "Eswar Prasad", field: "Writing", points: { "Followers": 1, "Meeting{27/06/26}": 1 } },
  { name: "Yaksh", field: "Writing", points: { "Followers": 13, "Volunteer": 8, "Task-1": 1, "Spamming {September}": 6, "Meeting{27/06/26}": 1 } },
  
  { name: "Nancy", field: "Finance", points: { "Followers": 10, "Volunteer": 12, "Task-1": 1, "Spamming {September}": 9, "Meeting{27/06/26}": 1 } },
  { name: "Yuvi", field: "Finance", points: { "Followers": 10, "Spamming {September}": 3, "Meeting{27/06/26}": 1 } },
  { name: "Dhriti", field: "Finance", points: { "Meeting{27/06/26}": 2 } },
  { name: "Aanya", field: "Finance", points: { "Spamming {September}": 2 } },
  
  { name: "Tanishka", field: "Social Media", points: { "Followers": 20, "Meeting{27/06/26}": 1 } },
  { name: "Angel", field: "Social Media", points: { "Volunteer": 4, "Task-1": 1, "Meeting{27/06/26}": 1 } },
  
  { name: "Adi", field: "HR", points: { "Followers": 1, "Task-1": 4, "Spamming {September}": 4, "Meeting{27/06/26}": 1 } },
  
  { name: "Yachna", field: "Event Planning", points: {} },
  
  { name: "Piyush", field: "Marketing", points: { "Followers": 25, "Task-1": 10, "Meeting{27/06/26}": 0 } },
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed Fields
    const fieldMap = {};
    for (const f of fields) {
      let fieldDoc = await Field.findOne({ name: f });
      if (!fieldDoc) {
        fieldDoc = await Field.create({ name: f });
      }
      fieldMap[f] = fieldDoc._id;
    }

    // Seed Categories
    const categoryMap = {};
    for (const c of categories) {
      let catDoc = await PointsCategory.findOne({ name: c });
      if (!catDoc) {
        catDoc = await PointsCategory.create({ name: c });
      }
      categoryMap[c] = catDoc._id;
    }

    // Seed Volunteers and Points
    for (const vData of data) {
      let volunteer = await Volunteer.findOne({ name: vData.name });
      if (!volunteer) {
        // Generate a random ID
        const randomId = vData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
        volunteer = await Volunteer.create({
          volunteerId: randomId,
          password: 'password123',
          plainPassword: 'password123',
          name: vData.name,
          mobile: '0000000000',
          field: fieldMap[vData.field]
        });
      }

      // Add points
      for (const [catName, pointsValue] of Object.entries(vData.points)) {
        if (pointsValue > 0) {
          // Check if points already exist to avoid duplicates
          const existingPoints = await Points.findOne({
            volunteer: volunteer._id,
            category: categoryMap[catName],
            points: pointsValue
          });

          if (!existingPoints) {
            await Points.create({
              volunteer: volunteer._id,
              category: categoryMap[catName],
              points: pointsValue,
              date: new Date('2024-09-27')
            });
          }
        }
      }
    }

    console.log('Data seeding completed successfully.');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding data:', err);
    mongoose.connection.close();
  }
}

seedData();
