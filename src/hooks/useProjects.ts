import { useState, useEffect } from 'react';

import { BillingPeriodType } from '../utils/dates';

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  billing_period_type: BillingPeriodType;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// API base URL
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

// Fallback projects in case API fails (Proyectos vigentes Feb 2026)
const FALLBACK_PROJECTS: Project[] = [
  { id: '1', code: '99_MINUTOS', name: '99 minutos', description: null, color: '#FF6B35', is_active: true, sort_order: 1, billing_period_type: 'standard' },
  { id: '2', code: 'AMAZON', name: 'Amazon', description: null, color: '#FF9900', is_active: true, sort_order: 2, billing_period_type: 'daily' }, // Amazon tiene período diario
  { id: '3', code: 'APYMSA', name: 'APYMSA', description: null, color: '#1E40AF', is_active: true, sort_order: 3, billing_period_type: 'standard' },
  { id: '4', code: 'CARSO_T1', name: 'CARSO T1', description: null, color: '#0F172A', is_active: true, sort_order: 4, billing_period_type: 'standard' },
  { id: '5', code: 'COPPEL', name: 'Coppel', description: null, color: '#FFD700', is_active: true, sort_order: 5, billing_period_type: 'standard' },
  { id: '6', code: 'DINAMICA_FILMICA', name: 'Dinámica Fílmica', description: null, color: '#8B5CF6', is_active: true, sort_order: 6, billing_period_type: 'standard' },
  { id: '7', code: 'ELEKTRA', name: 'Elektra', description: null, color: '#FACC15', is_active: true, sort_order: 7, billing_period_type: 'standard' },
  { id: '8', code: 'MERCADO_LIBRE', name: 'Mercado Libre', description: null, color: '#FFE600', is_active: true, sort_order: 8, billing_period_type: 'standard' },
  { id: '9', code: 'OFFICE_DEPOT', name: 'Office Depot', description: null, color: '#DC2626', is_active: true, sort_order: 9, billing_period_type: 'standard' },
  { id: '10', code: 'RAPPI_TURBO', name: 'Rappi Turbo', description: null, color: '#FF441F', is_active: true, sort_order: 10, billing_period_type: 'standard' },
  { id: '11', code: 'SAMS', name: 'Sam\'s Club', description: null, color: '#0066CC', is_active: true, sort_order: 11, billing_period_type: 'standard' },
  { id: '12', code: 'SODIMAC', name: 'Sodimac', description: null, color: '#FF6600', is_active: true, sort_order: 12, billing_period_type: 'standard' },
  { id: '13', code: 'SPEEDIANCE', name: 'Speediance', description: null, color: '#10B981', is_active: true, sort_order: 13, billing_period_type: 'standard' },
  { id: '14', code: 'WALMART', name: 'Walmart', description: null, color: '#0071DC', is_active: true, sort_order: 14, billing_period_type: 'standard' },
  { id: '99', code: 'OTROS', name: 'Otros', description: null, color: '#6B7280', is_active: true, sort_order: 99, billing_period_type: 'standard' },
];

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setProjects(data.data);
      } else {
        // Use fallback if API returns unexpected format
        console.warn('Using fallback projects');
        setProjects(FALLBACK_PROJECTS);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('No se pudieron cargar los proyectos');
      // Keep fallback projects on error
      setProjects(FALLBACK_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  };
};

// Helper to get project options for select dropdown
export const getProjectOptions = (projects: Project[]) => {
  return projects.map(p => ({
    value: p.code,
    label: p.name,
    color: p.color
  }));
};
