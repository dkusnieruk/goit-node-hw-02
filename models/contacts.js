const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const contacts = new Schema({
  name: {
    type: String,
    required: [true, "Set name for contact"],
  },
  email: { type: String },
  phone: { type: String },
  favorite: { type: Boolean, default: false },
});

const User = mongoose.model("contacts", contacts);

const listContacts = async () => {
  const contacts = await User.find();
  return contacts;
};

const getContactById = async (_id) => {
  const contact = await User.findById(_id);
  return contact;
};

const removeContact = async (_id) => {
  const contact = User.findByIdAndRemove(_id);
  return contact;
};

const addContact = async (name, phone, email, favorite) => {
  const user = new User({ name, phone, email, favorite });
  user.save();
  return user;
};

const updateContact = async (id, newUser) => {
  const contact = await User.findByIdAndUpdate(id, newUser);
  return contact;
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
