import { execSync } from 'child_process';

try {
  console.log('--- Checking active network ports using ss or netstat ---');
  try {
    const netstatOut = execSync('ss -tulpn || netstat -an', { encoding: 'utf-8' });
    console.log(netstatOut);
  } catch (e: any) {
    console.log('Error checking ports:', e.message);
  }

  console.log('--- Checking running Node processes ---');
  try {
    const psOut = execSync('ps aux | grep node', { encoding: 'utf-8' });
    console.log(psOut);
  } catch (e: any) {
    console.log('Error checking processes:', e.message);
  }
} catch (error: any) {
  console.error('Diagnostic error:', error);
}
