# 🎨 Standardisation des Modales - ACGE

## 📋 Guide de Migration

### ✅ **Modales déjà standardisées :**

1. **Dashboard CB** - Validation type d'opération et contrôles de fond
2. **Diagnostic Panel** - Panel de diagnostic
3. **Global Error Handler** - Gestionnaire d'erreurs global
4. **Test Simple Modal** - Modal de test

### 🔧 **Modales à standardiser :**

#### 1. **Modales Shadcn/UI (Déjà OK)**
- ✅ `Dialog` - Utilise `bg-primary/50` par défaut
- ✅ `AlertDialog` - Utilise `bg-primary/80` 
- ✅ `Sheet` - Utilise `bg-primary/50`

#### 2. **Modales de documents (À vérifier)**
- `document-viewer-safe.tsx`
- `document-preview-modal.tsx`
- `document-viewer-fullscreen.tsx`
- `gallery-viewer.tsx`

#### 3. **Modales personnalisées (À migrer)**
- Toute modale utilisant `bg-black/50` ou `bg-gray-500`

## 🚀 **Composant Standard**

Utilisez le composant `ModalBackdrop` pour toutes les nouvelles modales :

```tsx
import { ModalBackdrop } from '@/components/ui/modal-backdrop'

// Dans votre composant
{isOpen && (
  <ModalBackdrop 
    className="p-4"
    onClick={() => setIsOpen(false)}
  >
    <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-background rounded-lg shadow-xl">
      {/* Contenu de votre modale */}
    </div>
  </ModalBackdrop>
)}
```

## 🎯 **Classes CSS Standard**

```css
/* Backdrop standard */
.fixed.inset-0.bg-primary/50.backdrop-blur-sm.z-[9999].h-screen

/* Conteneur de modale */
.w-full.max-w-4xl.max-h-[90vh].overflow-auto.bg-background.rounded-lg.shadow-xl
```

## 📝 **Checklist de Migration**

- [ ] Remplacer `bg-black/50` par `bg-primary/50`
- [ ] Ajouter `backdrop-blur-sm`
- [ ] Ajouter `h-screen` pour couvrir tout l'écran
- [ ] Utiliser `z-[9999]` pour le z-index
- [ ] Tester sur différentes tailles d'écran
- [ ] Vérifier la cohérence visuelle

## 🔍 **Recherche des Modales à Migrer**

```bash
# Rechercher les anciens backdrops
grep -r "bg-black/50\|bg-gray-500\|bg-slate-500" src/ --include="*.tsx"

# Rechercher les modales personnalisées
grep -r "fixed inset-0" src/ --include="*.tsx"
```

## ✅ **Résultat Attendu**

Toutes les modales du projet auront :
- 🎨 **Couleur cohérente** : Bleu primaire (`bg-primary/50`)
- 🌫️ **Effet moderne** : Backdrop blur (`backdrop-blur-sm`)
- 📱 **Couverture complète** : Tout l'écran (`h-screen`)
- 🎯 **Z-index élevé** : Au-dessus de tout (`z-[9999]`)
- 🔄 **Réutilisabilité** : Composant `ModalBackdrop` standard

---

**🎉 Une fois terminé, toutes les modales auront le même style professionnel et cohérent !**
