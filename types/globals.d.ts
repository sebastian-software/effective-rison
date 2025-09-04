// Ambient declarations for UMD globals used in js/rison.js
declare var define: any;
declare var exports: any;

// Augment DOM Window with rison global used by UMD build
interface Window {
  rison: any;
}
