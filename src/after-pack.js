const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
    console.log('Running after-pack script...');
    console.log('Platform:', context.electronPlatformName);
    console.log('App out dir:', context.appOutDir);
    
    if (context.electronPlatformName === 'darwin') {
        const speechServicePath = path.join(
            context.appOutDir,
            'IdeaVault.app',
            'Contents',
            'Resources',
            'speech_service',
            'speech_service'
        );
        
        console.log('Setting executable permissions for:', speechServicePath);
        
        if (fs.existsSync(speechServicePath)) {
            try {
                fs.chmodSync(speechServicePath, 0o755);
                console.log('✓ Permissions set successfully');
            } catch (err) {
                console.error('✗ Failed to set permissions:', err);
            }
        } else {
            console.error('✗ Speech service not found at:', speechServicePath);
            console.error('Checking what exists in Resources:');
            const resourcesPath = path.join(
                context.appOutDir,
                'IdeaVault.app',
                'Contents',
                'Resources'
            );
            if (fs.existsSync(resourcesPath)) {
                console.error('Resources contents:', fs.readdirSync(resourcesPath));
                const speechDir = path.join(resourcesPath, 'speech_service');
                if (fs.existsSync(speechDir)) {
                    console.error('speech_service dir contents:', fs.readdirSync(speechDir));
                }
            }
        }
    } else if (context.electronPlatformName === 'win32') {
        // Windows doesn't need chmod, but let's verify the file exists
        const speechServicePath = path.join(
            context.appOutDir,
            'resources',
            'speech_service',
            'speech_service.exe'
        );
        
        console.log('Checking for Windows executable:', speechServicePath);
        if (fs.existsSync(speechServicePath)) {
            console.log('✓ Windows speech service found');
        } else {
            console.error('✗ Windows speech service not found');
        }
    }
};