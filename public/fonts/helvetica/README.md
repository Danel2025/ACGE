# Configuration des polices Helvetica

## 🚀 Ajout des fichiers Helvetica

1. **Placez vos fichiers Helvetica dans ce dossier** :
   - `Helvetica-Regular.ttf`
   - `Helvetica-Bold.ttf`
   - `Helvetica-Light.ttf`
   - `Helvetica-Medium.ttf`
   - Ou tout autre variante (.ttf, .woff, .woff2)

2. **Exécutez le script de configuration** :
   ```bash
   node setup-helvetica.js
   ```

3. **Ajoutez l'import dans votre CSS** :
   ```css
   @import "/fonts/helvetica/helvetica-fonts.css";
   ```

## 📁 Structure attendue

```
public/fonts/helvetica/
├── Helvetica-Regular.ttf
├── Helvetica-Bold.ttf
├── Helvetica-Light.ttf
├── Helvetica-Medium.ttf
├── setup-helvetica.js
├── helvetica-fonts.css (généré automatiquement)
└── README.md
```

## 🎯 Résultat

- **Helvetica** sera utilisée comme police principale
- **Outfit** restera pour les titres
- **FreeMono** pour les caractères spéciaux

## 🔄 Redémarrage

Après avoir ajouté les fichiers, redémarrez votre serveur de développement :
```bash
npm run dev
```

Les modifications seront alors visibles dans votre application !
