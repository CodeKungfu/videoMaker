import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { shots: true, assets: true }
        }
      }
    });
    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create project
router.post('/', async (req, res) => {
  const { title, logline, type } = req.body;
  try {
    const project = await prisma.project.create({
      data: { title, logline, type: type || 'STATIC' }
    });
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get project details
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { 
        shots: true, 
        assets: true,
        _count: {
          select: { shots: true, assets: true }
        }
      }
    });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, logline, type } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id },
      data: { title, logline, type }
    });
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.project.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;