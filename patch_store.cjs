const fs = require('fs');
let content = fs.readFileSync('src/services/orion/orionApprovalStore.ts', 'utf8');
content = content.replace("import prisma from '../../db/prisma';", "import { prisma } from '../../db/prisma';");
fs.writeFileSync('src/services/orion/orionApprovalStore.ts', content);
