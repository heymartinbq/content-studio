import { execSync } from 'child_process';

/**
 * Script de validación estricta de documentos mandatorios.
 * Bloquea el commit si hay cambios en el código (src/ o src-rs/)
 * pero no se han incluido actualizaciones en los docs base.
 */

try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).split('\n');

    const mandatoryDocs = [
        'CHANGELOG.md',
        'README.md',
        'AI_ASSISTANT_RULES.md',
        'ROADMAP.md'
    ];

    const hasCodeChanges = stagedFiles.some(file => file.startsWith('src/') || file.startsWith('src-rs/'));

    if (hasCodeChanges) {
        const missingDocs = mandatoryDocs.filter(doc => !stagedFiles.includes(doc));

        if (missingDocs.length > 0) {
            console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: Commit bloqueado (Integridad Documental)');
            console.error('Se detectaron cambios en el código pero falta actualizar:');
            missingDocs.forEach(doc => console.error(` - ${doc}`));
            console.error('\nAsegúrate de reflejar los cambios en la documentación antes de reintentar.');
            process.exit(1);
        }
    }

    console.log('\x1b[32m%s\x1b[0m', '✅ Validación documental exitosa.');
    process.exit(0);
} catch (error) {
    console.error('Fallo al ejecutar la validación de Husky:', error.message);
    process.exit(1);
}
