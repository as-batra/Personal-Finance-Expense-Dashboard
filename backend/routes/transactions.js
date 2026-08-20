import express from 'express';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET /api/transactions - Fetch all transactions sorted by date descending
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
  }
});

// GET /api/transactions/summary - Aggregate spending by category
router.get('/summary', async (req, res) => {
  try {
    /*
     * MongoDB Aggregation Pipeline:
     * 1. $group: Groups transactions by the "category" field and calculates the sum of "amount" for each.
     * 2. $project: Reshapes the output documents to rename "_id" to "category" and retain "totalSpent".
     */
    const summary = await Transaction.aggregate([
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalSpent: 1,
        },
      },
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error generating spending summary', error: error.message });
  }
});

// POST /api/transactions - Create a new transaction
router.post('/', async (req, res) => {
  const { title, amount, category, date } = req.body;
  try {
    const newTransaction = new Transaction({
      title,
      amount,
      category,
      date: date || undefined, // use default schema value if empty
    });
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', error: error.message });
    }
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
});

// DELETE /api/transactions/:id - Delete a transaction by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
});

export default router;
