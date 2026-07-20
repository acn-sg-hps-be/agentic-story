import './styles.css';
import { createApp } from './ui/app';

const mount = document.getElementById('app')!;
createApp(mount).catch((e) => {
  mount.innerHTML = '<div class="af-error"><h2>Something went wrong starting the app.</h2></div>';
  console.error(e);
});
