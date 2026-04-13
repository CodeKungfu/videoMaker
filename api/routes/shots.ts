import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Get shots by project id
router.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });
  try {
    const shots = await prisma.shot.findMany({
      where: { projectId: parseInt(projectId as string) },
      orderBy: { shotNumber: 'asc' }
    });
    res.json({ success: true, data: shots });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create shot
router.post('/', async (req, res) => {
  const { projectId, shotNumber, shotType, subject, action, emotion, scene, dialog } = req.body;
  try {
    const shot = await prisma.shot.create({
      data: {
        projectId: parseInt(projectId),
        shotNumber,
        shotType,
        subject,
        action,
        emotion,
        scene,
        dialog
      }
    });
    res.json({ success: true, data: shot });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update shot
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.body;
  try {
    const shot = await prisma.shot.update({
      where: { id },
      data
    });
    res.json({ success: true, data: shot });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete shot
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.shot.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;