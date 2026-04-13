import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Get assets by project id
router.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });
  try {
    const assets = await prisma.asset.findMany({
      where: { projectId: parseInt(projectId as string) },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: assets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create asset
router.post('/', async (req, res) => {
  const { projectId, type, name, anchors, clothing, forbidden, referenceUrl } = req.body;
  try {
    const asset = await prisma.asset.create({
      data: {
        projectId: parseInt(projectId),
        type, // ROLE, SCENE, PROP
        name,
        anchors,
        clothing,
        forbidden,
        referenceUrl
      }
    });
    res.json({ success: true, data: asset });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update asset
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.body;
  try {
    const asset = await prisma.asset.update({
      where: { id },
      data
    });
    res.json({ success: true, data: asset });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete asset
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.asset.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;