const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v1: uuidv1 } = require('uuid');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const s3 = new AWS.S3();

router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Event name is required' });
  }

  try {
    const event = new Event({ name });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:eventId/upload', upload.array('images', 100), async (req, res) => {
  const eventId = req.params.eventId;
  const files = req.files;

  try {
    const promises = Object.keys(files).map(async (key) => {
      const file = files[key];
      const keyName = `${eventId}/${uuidv1()}_${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: keyName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const data = await s3.upload(params).promise();
      return data.Location;
    });

    const imageUrls = await Promise.all(promises);

    const event = await Event.findOneAndUpdate(
      { eventId: eventId },
      { $push: { imageUrls: { $each: imageUrls } } },
      { new: true }
    );

    if (!event) {
      console.error('Event not found');
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('Event document after update:', event);

    res.json({ imageUrls });

    console.log("Images uploaded successfully for event with ID:", eventId);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
