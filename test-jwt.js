import jwt from 'jsonwebtoken';
const token = jwt.sign({ sub: 'usr-sarji-superadmin', role: 'SUPER_ADMIN' }, process.env.JWT_SECRET || 'secret');
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
console.log(decoded);
