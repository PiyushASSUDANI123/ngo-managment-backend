const mongoose = require('mongoose');

const volunteerPageConfigSchema = new mongoose.Schema({
  title: { type: String, default: '🚨✨ WE’RE RECRUITING VOLUNTEERS! ✨🚨' },
  subtitle: { type: String, default: 'Hey everyone! 💌🌷\nWant to be a part of something meaningful and create a real impact? 💫' },
  visionTitle: { type: String, default: '🌸 EnVision Foundation 🌸' },
  visionText: { type: String, default: 'is a youth-led initiative working towards empowering underprivileged children through:' },
  visionPoints: { type: [String], default: ['📚 Equal access to education & opportunities', '🎨 Platforms to express creativity & imagination', '🤝 Mentoring, guidance & support'] },
  footerText: { type: String, default: '📍 We’re especially looking for ACTIVE NCR TEAM MEMBERS! 🚨\n\nWhether you have ideas, skills, creativity, energy, or simply the willingness to make a difference — there’s a place for you here! 🫶🏻🌸' },
  formFields: { 
    type: [{
      name: String,
      label: String,
      type: String, // 'text', 'email', 'tel', 'url', 'textarea', 'radio'
      required: Boolean,
      options: [String], // for radio
      placeholder: String,
    }],
    default: [
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
      { name: 'contact', label: 'Contact', type: 'tel', required: true, placeholder: 'Phone number' },
      { name: 'className', label: 'Class/Year', type: 'text', required: true, placeholder: 'e.g. B.Tech 1st Year' },
      { name: 'school', label: 'Institution', type: 'text', required: true, placeholder: 'School/College Name' },
      { name: 'location', label: 'Location (City, State)', type: 'text', required: true, placeholder: 'Where are you from?' },
      { name: 'department', label: 'Preferred Department', type: 'radio', required: true, options: ['Social Media', 'Writing', 'HR', 'Event Planning', 'Finance and marketing', 'Outreach'] },
      { name: 'reason', label: 'Why do you want to join EnVision?', type: 'textarea', required: true, placeholder: 'Tell us your motivation...' },
      { name: 'experienceLink', label: 'Past Experience / Resume Link', type: 'url', required: false, placeholder: 'Link to Drive/LinkedIn/Portfolio' },
      { name: 'reference', label: 'Reference Name (Optional)', type: 'text', required: false, placeholder: 'Who referred you?' }
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model('VolunteerPageConfig', volunteerPageConfigSchema);
