#!/usr/bin/env node

/**
 * FFmpeg Installation Check Script
 * This script checks if FFmpeg is installed and provides guidance if not.
 */

const { execSync } = require('child_process');
const os = require('os');

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('✓ FFmpeg is already installed');
    return true;
  } catch (error) {
    console.log('⚠ FFmpeg not found. Installing ffmpeg-static...');
    return false;
  }
}

function getInstallationGuide() {
  const platform = os.platform();

  switch (platform) {
    case 'darwin':
      return 'To install FFmpeg on macOS:\n  brew install ffmpeg';
    case 'linux':
      return 'To install FFmpeg on Linux:\n  apt-get install ffmpeg  # Debian/Ubuntu\n  yum install ffmpeg      # CentOS/RHEL';
    case 'win32':
      return 'To install FFmpeg on Windows:\n  choco install ffmpeg    # Chocolatey\n  winget install ffmpeg   # Winget';
    default:
      return 'Please install FFmpeg for your operating system.\nVisit https://ffmpeg.org/download.html';
  }
}

// Run check
const isInstalled = checkFFmpeg();

if (!isInstalled) {
  console.log('\n📦 The node will use ffmpeg-static package for FFmpeg binary.');
  console.log('📖 Installation guide:\n');
  console.log(getInstallationGuide());
}
