
import { supabase } from '@/integrations/supabase/client';
import { Shipment, SupabaseShipment, StatusHistoryItem } from '@/lib/types';

// Convert from Supabase format to our app format
export const mapSupabaseShipment = (dbShipment: SupabaseShipment): Shipment => {
  return {
    id: dbShipment.id,
    noSuratJalan: dbShipment.no_surat_jalan,
    perusahaan: dbShipment.perusahaan,
    tujuan: dbShipment.tujuan,
    supir: dbShipment.supir,
    tanggalKirim: dbShipment.tanggal_kirim,
    tanggalTiba: dbShipment.tanggal_tiba,
    status: dbShipment.status,
    kendala: dbShipment.kendala,
    qty: dbShipment.qty
  };
};

// Convert to Supabase format
export const mapToSupabaseShipment = (shipment: Partial<Shipment>): Partial<SupabaseShipment> => {
  const result: Partial<SupabaseShipment> = {};
  
  if (shipment.noSuratJalan !== undefined) result.no_surat_jalan = shipment.noSuratJalan;
  if (shipment.perusahaan !== undefined) result.perusahaan = shipment.perusahaan;
  if (shipment.tujuan !== undefined) result.tujuan = shipment.tujuan;
  if (shipment.supir !== undefined) result.supir = shipment.supir;
  if (shipment.tanggalKirim !== undefined) result.tanggal_kirim = shipment.tanggalKirim;
  if (shipment.tanggalTiba !== undefined) result.tanggal_tiba = shipment.tanggalTiba;
  if (shipment.status !== undefined) result.status = shipment.status;
  if (shipment.kendala !== undefined) result.kendala = shipment.kendala;
  if (shipment.qty !== undefined) result.qty = shipment.qty;
  
  return result;
};

// Get all shipments
export const getShipments = async (): Promise<Shipment[]> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .order('tanggal_kirim', { ascending: false });

  if (error) {
    console.error('Error fetching shipments:', error);
    throw error;
  }

  return (data as SupabaseShipment[]).map(mapSupabaseShipment);
};

// Get a single shipment by ID
export const getShipmentById = async (id: string): Promise<Shipment | null> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null;
    }
    console.error('Error fetching shipment:', error);
    throw error;
  }

  return data ? mapSupabaseShipment(data as SupabaseShipment) : null;
};

// Create a new shipment
export const createShipment = async (shipment: Omit<Shipment, 'id'>): Promise<Shipment> => {
  const { data, error } = await supabase
    .from('shipments')
    .insert(mapToSupabaseShipment(shipment))
    .select()
    .single();

  if (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }

  return mapSupabaseShipment(data as SupabaseShipment);
};

// Update an existing shipment
export const updateShipment = async (id: string, shipment: Partial<Shipment>): Promise<Shipment> => {
  const { data, error } = await supabase
    .from('shipments')
    .update(mapToSupabaseShipment(shipment))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating shipment:', error);
    throw error;
  }

  return mapSupabaseShipment(data as SupabaseShipment);
};

// Delete a shipment
export const deleteShipment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('shipments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting shipment:', error);
    throw error;
  }
};

// Get status history for a shipment
export const getShipmentStatusHistory = async (shipmentId: string): Promise<StatusHistoryItem[]> => {
  const { data, error } = await supabase
    .from('status_history')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }

  return data as StatusHistoryItem[];
};

// Batch import shipments
export const batchImportShipments = async (shipments: Omit<Shipment, 'id'>[]): Promise<Shipment[]> => {
  // Map each shipment to Supabase format
  const supabaseShipments = shipments.map(mapToSupabaseShipment);
  
  const { data, error } = await supabase
    .from('shipments')
    .insert(supabaseShipments)
    .select();

  if (error) {
    console.error('Error batch importing shipments:', error);
    throw error;
  }

  return (data as SupabaseShipment[]).map(mapSupabaseShipment);
};
