
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// --- Type Definitions ---
export interface TypeOperation {
  id: string;
  nom: string;
  description?: string;
}

export interface NatureOperation {
  id: string;
  nom: string;
  description?: string;
  type_operation_id: string;
}

export interface PieceJustificative {
  id: string;
  nom: string;
  description?: string;
  obligatoire: boolean;
  ordre: number;
}

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// --- Custom Hooks for Data Fetching ---

/**
 * Hook to fetch operation types.
 */
export function useTypesOperations() {
  const [state, setState] = useState<FetchState<TypeOperation[]>>({
    data: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prevState => ({ ...prevState, isLoading: true, error: null }));
        const response = await fetch('/api/types-operations');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Erreur ${response.status} lors du chargement des types`);
        }
        const data = await response.json();
        setState({ data: data.types || [], isLoading: false, error: null });

        if (!data.types || data.types.length === 0) {
          toast.info("Aucun type d'opération trouvé. Veuillez vérifier la configuration.");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
        toast.error(errorMessage);
        setState({ data: [], isLoading: false, error: errorMessage });
      }
    };

    fetchData();
  }, []);

  return state;
}

/**
 * Hook to fetch operation natures based on typeId.
 */
export function useNaturesOperations(typeId: string | null) {
  const [state, setState] = useState<FetchState<NatureOperation[]>>({
    data: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!typeId) {
      setState({ data: [], isLoading: false, error: null });
      return;
    }

    const fetchData = async () => {
      try {
        setState({ data: [], isLoading: true, error: null });
        const response = await fetch(`/api/natures-operations?type_id=${typeId}`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des natures d\'opération');
        }
        const data = await response.json();
        setState({ data: data.natures || [], isLoading: false, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
        toast.error(errorMessage);
        setState({ data: [], isLoading: false, error: errorMessage });
      }
    };

    fetchData();
  }, [typeId]);

  return state;
}

/**
 * Hook to fetch supporting documents based on natureId.
 */
export function usePiecesJustificatives(natureId: string | null) {
  const [state, setState] = useState<FetchState<PieceJustificative[]>>({
    data: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!natureId) {
      setState({ data: [], isLoading: false, error: null });
      return;
    }

    const fetchData = async () => {
      try {
        setState({ data: [], isLoading: true, error: null });
        const response = await fetch(`/api/pieces-justificatives?nature_id=${natureId}`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des pièces justificatives');
        }
        const data = await response.json();
        const sortedPieces = (data.pieces || []).sort((a: PieceJustificative, b: PieceJustificative) => a.ordre - b.ordre);
        setState({ data: sortedPieces, isLoading: false, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
        toast.error(errorMessage);
        setState({ data: [], isLoading: false, error: errorMessage });
      }
    };

    fetchData();
  }, [natureId]);

  return state;
}
