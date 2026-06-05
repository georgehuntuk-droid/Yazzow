import { execSync } from 'child_process';

try {
  console.log('Adding files...');
  execSync('git add -A');
  console.log('Staged successfully.');

  console.log('Committing changes...');
  const commitMsg = 'feat: add a Change Details action to the Join Family success state so users can correct typos';
  const commitOut = execSync(`git -c user.name="georgehuntuk-droid" -c user.email="georgehuntuk-droid@users.noreply.github.com" commit -m "${commitMsg}"`);
  console.log(commitOut.toString());

  console.log('Pushing to GitHub...');
  const pushOut = execSync('git push origin main');
  console.log(pushOut.toString());

  console.log('Git operations completed successfully!');
} catch (e) {
  console.error('Error during Git operations:', e.stdout ? e.stdout.toString() : e.message);
}
