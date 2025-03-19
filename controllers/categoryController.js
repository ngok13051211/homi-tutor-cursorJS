const { Category } = require("../models");

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Public
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private (Admin only)
 */
const createCategory = async (req, res) => {
  try {
    const { name, type, grade, description, subjects } = req.body;

    const category = await Category.create({
      name,
      type,
      grade,
      description,
      subjects,
    });

    if (category) {
      res.status(201).json(category);
    } else {
      res.status(400).json({ message: "Invalid category data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a category
 * @route PUT /api/categories/:id
 * @access Private (Admin only)
 */
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name, type, grade, description, subjects } = req.body;

    // Update fields
    if (name) category.name = name;
    if (type) category.type = type;
    if (grade !== undefined) category.grade = grade;
    if (description) category.description = description;
    if (subjects) category.subjects = subjects;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a category
 * @route DELETE /api/categories/:id
 * @access Private (Admin only)
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.remove();
    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
