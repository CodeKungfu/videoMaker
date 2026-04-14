import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    // Convert array of {key, value} to a single object {key: value}
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    
    res.json({ success: true, data: settingsObj });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update or create settings
router.post('/', async (req, res) => {
  const updates = req.body; // Expecting an object like { openaiKey: "...", comfyUiUrl: "..." }
  
  try {
    const transactions = Object.entries(updates).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });
    
    await prisma.$transaction(transactions);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;