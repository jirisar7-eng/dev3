const fs = require('fs');
const content = fs.readFileSync('src/routes/orionRoutes.ts', 'utf8');

const updatedContent = content
  .replace(
    /router\.post\('\/approvals\/:id\/approve',.*?\);/s,
    `router.post('/approvals/:id/approve', requireAuth as any, requireRole('SUPER_ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const approval = await OrionApprovalStore.get(id);
  if (!approval) {
    return res.status(404).json({ success: false, error: 'Approval request not found.' });
  }
  if (approval.status !== 'PENDING') {
    return res.status(400).json({ success: false, error: \`Cannot approve request in status \${approval.status}\` });
  }
  if (Date.now() > approval.expiresAt) {
    await OrionApprovalStore.transitionStatus(id, 'PENDING', 'EXPIRED');
    return res.status(400).json({ success: false, error: 'Request expired.' });
  }
  
  const transitioned = await OrionApprovalStore.transitionStatus(id, 'PENDING', 'APPROVED', { by: req.user?.id });
  if (!transitioned) {
    return res.status(409).json({ success: false, error: 'Failed to approve. Status may have changed.' });
  }
  res.json({ success: true, status: 'APPROVED', approvalId: id });
});`
  )
  .replace(
    /router\.post\('\/approvals\/:id\/reject',.*?\);/s,
    `router.post('/approvals/:id/reject', requireAuth as any, requireRole('SUPER_ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const approval = await OrionApprovalStore.get(id);
  if (!approval) {
    return res.status(404).json({ success: false, error: 'Approval request not found.' });
  }
  if (approval.status !== 'PENDING') {
    return res.status(400).json({ success: false, error: \`Cannot reject request in status \${approval.status}\` });
  }
  
  const transitioned = await OrionApprovalStore.transitionStatus(id, 'PENDING', 'REJECTED', { by: req.user?.id });
  if (!transitioned) {
    return res.status(409).json({ success: false, error: 'Failed to reject. Status may have changed.' });
  }
  res.json({ success: true, status: 'REJECTED', approvalId: id });
});`
  )
  .replace(
    /router\.get\('\/approvals',.*?\);/s,
    `router.get('/approvals', requireAuth as any, requireRole('SUPER_ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  const approvals = await OrionApprovalStore.getAll();
  res.json({ success: true, data: approvals });
});`
  );

fs.writeFileSync('src/routes/orionRoutes.ts', updatedContent);
