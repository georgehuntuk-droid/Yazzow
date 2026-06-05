import { execSync } from 'child_process';

try {
  console.log('Adding files...');
  execSync('git add -A');
  console.log('Staged successfully.');

  console.log('Committing changes...');
  const commitMsg = 'fix: harden site URL parsing to prevent server-side crash on empty or invalid env vars';
  const commitOut = execSync(`git -c user.name="georgehuntuk-droid" -c user.email="georgehuntuk-droid@users.noreply.github.com" commit -m "${commitMsg}"`);
  console.log(commitOut.toString());

  console.log('Pushing to GitHub...');
  const pushOut = execSync('git push origin main');
  console.log(pushOut.toString());

  console.log('Git operations completed successfully!');
} catch (e) {
  console.error('Error during Git operations:', e.stdout ? e.stdout.toString() : e.message);
}
