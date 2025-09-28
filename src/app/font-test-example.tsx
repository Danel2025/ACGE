/**
 * Exemple d'utilisation des polices configurées
 * Ce fichier sert de guide pour utiliser correctement les polices
 */

export function FontTestExample() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="font-title-bold text-3xl text-primary">
        Titre principal avec Outfit
      </h1>

      <h2 className="font-title-semibold text-2xl text-muted-foreground">
        Sous-titre avec Outfit SemiBold
      </h2>

      <p className="font-helvetica text-base leading-relaxed text-foreground">
        Ce paragraphe utilise Helvetica Neue (police par défaut) pour une meilleure lisibilité.
        Le texte est plus facile à lire avec cette police système optimisée.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-title-medium text-lg">Informations avec Outfit</h3>
          <div className="space-y-2">
            <p className="text-number">Numéro: 123456789</p>
            <p className="text-date">Date: 25/09/2025</p>
            <p className="text-amount">Montant: 1 250 000 FCFA</p>
            <p className="text-reference">Référence: DOC-2025-001</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-helvetica font-title-medium text-lg">Texte normal</h3>
          <p className="text-sm">
            Tout le texte utilise maintenant Helvetica Neue par défaut,
            sauf les titres qui gardent Outfit pour un aspect moderne.
          </p>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-title-bold text-lg mb-2">Code d'exemple:</h4>
        <pre className="text-code text-sm overflow-x-auto">
{`<h1 className="font-title-bold">Titre avec Outfit</h1>
<p className="font-helvetica">Texte avec Helvetica</p>
<span className="text-number">123456</span>`}
        </pre>
      </div>
    </div>
  );
}
