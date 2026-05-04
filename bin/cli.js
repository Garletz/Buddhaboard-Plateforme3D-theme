#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || 'buddhaboard-theme';
const destPath = path.resolve(process.cwd(), targetDir);

console.log(`\n🧘 Bienvenue dans l'installateur BuddhaBoard !`);
console.log(`Clonage du thème dans le dossier : ${destPath}...\n`);

try {
    // Utilisation de degit pour cloner silencieusement et rapidement sans l'historique git
    execSync(`npx degit Garletz/Buddhaboard-Plateforme3D-theme "${destPath}"`, { stdio: 'inherit' });
    
    console.log(`\n✅ Succès ! Le thème a été installé avec succès dans ./${targetDir}`);
    console.log(`\nPour intégrer le thème dans votre projet Astro :`);
    console.log(`1. Importez les composants depuis ./${targetDir}/src`);
    console.log(`2. N'oubliez pas d'installer les dépendances requises (gsap, tone).`);
    console.log(`\nQue l'Éveil soit avec votre code ! 🙏\n`);
} catch (error) {
    console.error('\n❌ Erreur lors du téléchargement du thème.', error);
    process.exit(1);
}
