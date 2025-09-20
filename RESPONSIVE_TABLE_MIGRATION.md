# Guide de Migration des Tableaux Responsives

## 🎯 Objectif
Convertir tous les tableaux existants pour qu'ils soient responsives et tactiles.

## 📋 Fichiers à Migrer

### Pages Dashboard avec Tableaux Non-Responsives :
- [ ] `src/app/(protected)/cb-dashboard/page.tsx`
- [ ] `src/app/(protected)/cb-rejected/page.tsx`
- [ ] `src/app/(protected)/ordonnateur-dashboard/page.tsx`
- [ ] `src/app/(protected)/ac-dashboard/page.tsx`
- [ ] `src/app/(protected)/secretaire-rejected/page.tsx`
- [ ] `src/app/(protected)/folders/page.tsx`
- [ ] `src/app/(protected)/ordonnateur-dashboard/dossier/[id]/page.tsx`

## 🔧 Étapes de Migration

### 1. Remplacer les Imports
**Ancien :**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
```

**Nouveau :**
```tsx
import { 
  ResponsiveTableWrapper,
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow,
  ResponsiveTableCell,
  TableActionButton,
  TableActionsMenu
} from '@/components/ui/responsive-table-wrapper'
```

### 2. Wrapper le Tableau
**Ancien :**
```tsx
<Table>
  <TableHeader>
    // ...
  </TableHeader>
  <TableBody>
    // ...
  </TableBody>
</Table>
```

**Nouveau :**
```tsx
<ResponsiveTableWrapper>
  <Table>
    <TableHeader>
      // ...
    </TableHeader>
    <TableBody>
      // ...
    </TableBody>
  </Table>
</ResponsiveTableWrapper>
```

### 3. Remplacer les Cellules
**Ancien :**
```tsx
<TableCell>{longText}</TableCell>
```

**Nouveau :**
```tsx
<ResponsiveTableCell>{longText}</ResponsiveTableCell>
```

### 4. Améliorer les Boutons d'Actions
**Ancien :**
```tsx
<Button variant="ghost" size="sm" onClick={handleAction}>
  <MoreHorizontal className="w-4 h-4" />
</Button>
```

**Nouveau :**
```tsx
<TableActionsMenu
  actions={[
    {
      label: 'Voir',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => handleView(item)
    },
    {
      label: 'Modifier',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => handleEdit(item)
    },
    {
      label: 'Supprimer',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => handleDelete(item),
      variant: 'destructive'
    }
  ]}
/>
```

### 5. Boutons Individuels
**Ancien :**
```tsx
<Button variant="ghost" size="sm" onClick={handleAction}>
  <Eye className="w-4 h-4" />
</Button>
```

**Nouveau :**
```tsx
<TableActionButton variant="ghost" size="icon" onClick={handleAction}>
  <Eye className="w-4 h-4" />
</TableActionButton>
```

## 🎨 Avantages de la Migration

### ✅ Responsivité
- Scroll horizontal automatique sur mobile
- Tailles tactiles appropriées (44x44px minimum)
- Texte tronqué avec tooltips

### ✅ Accessibilité
- Labels ARIA appropriés
- Support clavier amélioré
- Contraste et focus visibles

### ✅ UX Mobile
- Boutons facilement cliquables au doigt
- Menus d'actions consolidés
- Espacement adaptatif

## 🚀 Exemple Complet

```tsx
// Avant
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Nom</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>
            <Button variant="ghost" size="sm" onClick={() => handleView(item)}>
              <Eye className="w-4 h-4" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>

// Après
<ResponsiveTableWrapper>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Nom</TableHead>
        <TableHead className="w-16">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <ResponsiveTableCell>{item.name}</ResponsiveTableCell>
          <TableCell>
            <TableActionsMenu
              actions={[
                {
                  label: 'Voir',
                  icon: <Eye className="h-4 w-4" />,
                  onClick: () => handleView(item)
                }
              ]}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ResponsiveTableWrapper>
```
