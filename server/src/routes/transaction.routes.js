import { Router } from 'express';
import { prisma, serializeModel } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../schemas/transaction.schema.js';

const router = Router();

// Apply requireAuth to all transaction routes
router.use(requireAuth);

// GET /api/transactions
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      category,
      type,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    // Build strict user-scoped filter
    const where = {
      userId: req.user.id, // Strictly user-isolated!
    };

    if (type && (type === 'income' || type === 'expense')) {
      where.type = type;
    }

    if (category && category !== 'ALL') {
      where.category = {
        equals: category,
      };
    }

    if (search && search.trim()) {
      where.OR = [
        { description: { contains: search.trim() } },
        { paymentMethod: { contains: search.trim() } },
        { notes: { contains: search.trim() } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const orderBy = {};
    if (sortBy === 'amount') {
      orderBy.amount = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.date = order === 'asc' ? 'asc' : 'desc';
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.json({
      success: true,
      data: serializeModel(transactions),
      pagination: {
        page: pageNum,
        limit: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/export (CSV export)
router.get('/export', async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Description', 'Payment Method', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.date.toISOString().slice(0, 10),
      t.type,
      serializeModel(t.amount),
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=spendsense_export_${Date.now()}.csv`);
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id, // Strictly user-isolated!
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or unauthorized.',
      });
    }

    return res.json({
      success: true,
      data: serializeModel(transaction),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions
router.post('/', validate(createTransactionSchema), async (req, res, next) => {
  try {
    const { type, amount, category, description, date, paymentMethod, notes } = req.body;

    // Server enforces userId from authenticated session
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        type,
        amount,
        category,
        description,
        date: new Date(date),
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: serializeModel(transaction),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', validate(updateTransactionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership before updating
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or unauthorized.',
      });
    }

    // Whitelist allowed updates to prevent mass assignment of userId or id
    const { type, amount, category, description, date, paymentMethod, notes } = req.body;
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: serializeModel(updated),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership before deleting
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or unauthorized.',
      });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Transaction deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

