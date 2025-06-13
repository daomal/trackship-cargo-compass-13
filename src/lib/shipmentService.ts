
import { supabase } from '@/integrations/supabase/client';
import { Shipment, SupabaseShipment, StatusHistoryItem, Driver } from '@/lib/types';

// Convert from Supabase format to our app format
export const mapSupabaseShipment = (dbShipment: SupabaseShipment): Shipment => {
  return {
    id: dbShipment.id,
    noSuratJalan: dbShipment.no_surat_jalan,
    perusahaan: dbShipment.perusahaan,
    tujuan: dbShipment.tujuan,
    driverId: dbShipment.driver_id,
    tanggalKirim: dbShipment.tanggal_kirim,
    tanggalTiba: dbShipment.tanggal_tiba,
    waktuTiba: dbShipment.waktu_tiba,
    status: dbShipment.status,
    kendala: dbShipment.kendala,
    qty: dbShipment.qty,
    trackingUrl: dbShipment.tracking_url,
    currentLat: dbShipment.current_lat,
    currentLng: dbShipment.current_lng,
    drivers: dbShipment.drivers
  };
};

// Convert to Supabase format
export const mapToSupabaseShipment = (shipment: Partial<Shipment>) => {
  // Create object to hold Supabase-formatted values
  const supabaseShipment: {
    no_surat_jalan?: string;
    perusahaan?: string;
    tujuan?: string;
    driver_id?: string | null;
    tanggal_kirim?: string;
    tanggal_tiba?: string | null;
    waktu_tiba?: string | null;
    status?: string;
    kendala?: string | null;
    qty?: number;
    tracking_url?: string | null;
    current_lat?: number | null;
    current_lng?: number | null;
  } = {};
  
  if (shipment.noSuratJalan !== undefined) supabaseShipment.no_surat_jalan = shipment.noSuratJalan;
  if (shipment.perusahaan !== undefined) supabaseShipment.perusahaan = shipment.perusahaan;
  if (shipment.tujuan !== undefined) supabaseShipment.tujuan = shipment.tujuan;
  if (shipment.driverId !== undefined) supabaseShipment.driver_id = shipment.driverId;
  if (shipment.tanggalKirim !== undefined) supabaseShipment.tanggal_kirim = shipment.tanggalKirim;
  if (shipment.tanggalTiba !== undefined) supabaseShipment.tanggal_tiba = shipment.tanggalTiba;
  if (shipment.waktuTiba !== undefined) supabaseShipment.waktu_tiba = shipment.waktuTiba;
  if (shipment.status !== undefined) supabaseShipment.status = shipment.status;
  if (shipment.kendala !== undefined) supabaseShipment.kendala = shipment.kendala;
  if (shipment.qty !== undefined) supabaseShipment.qty = shipment.qty;
  if (shipment.trackingUrl !== undefined) supabaseShipment.tracking_url = shipment.trackingUrl;
  if (shipment.currentLat !== undefined) supabaseShipment.current_lat = shipment.currentLat;
  if (shipment.currentLng !== undefined) supabaseShipment.current_lng = shipment.currentLng;
  
  return supabaseShipment;
};

// Get all drivers
export const getDrivers = async (): Promise<Driver[]> => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }

  return data.map(driver => ({
    id: driver.id,
    name: driver.name,
    licensePlate: driver.license_plate
  }));
};

// Get all shipments with driver data
export const getShipments = async (): Promise<Shipment[]> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*, drivers (id, name, license_plate)')
    .order('tanggal_kirim', { ascending: false });

  if (error) {
    console.error('Error fetching shipments:', error);
    throw error;
  }

  return (data as SupabaseShipment[]).map(mapSupabaseShipment);
};

// Get a single shipment by ID with driver data
export const getShipmentById = async (id: string): Promise<Shipment | null> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*, drivers (id, name, license_plate)')
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
    .insert({
      no_surat_jalan: shipment.noSuratJalan,
      perusahaan: shipment.perusahaan,
      tujuan: shipment.tujuan,
      driver_id: shipment.driverId,
      tanggal_kirim: shipment.tanggalKirim,
      tanggal_tiba: shipment.tanggalTiba,
      waktu_tiba: shipment.waktuTiba,
      status: shipment.status,
      kendala: shipment.kendala,
      qty: shipment.qty,
      tracking_url: shipment.trackingUrl,
      current_lat: shipment.currentLat,
      current_lng: shipment.currentLng
    })
    .select('*, drivers (id, name, license_plate)')
    .single();

  if (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }

  return mapSupabaseShipment(data as SupabaseShipment);
};

// Update an existing shipment
export const updateShipment = async (id: string, shipment: Partial<Shipment>): Promise<Shipment> => {
  const supabaseShipment = mapToSupabaseShipment(shipment);
  
  console.log('Updating shipment with ID:', id);
  console.log('Update data:', supabaseShipment);

  const { data, error } = await supabase
    .from('shipments')
    .update(supabaseShipment)
    .eq('id', id)
    .select('*, drivers (id, name, license_plate)')
    .single();

  if (error) {
    console.error('Error updating shipment:', error);
    throw error;
  }

  console.log('Shipment update successful:', data);
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
  const supabaseShipments = shipments.map(shipment => ({
    no_surat_jalan: shipment.noSuratJalan,
    perusahaan: shipment.perusahaan,
    tujuan: shipment.tujuan,
    driver_id: shipment.driverId,
    tanggal_kirim: shipment.tanggalKirim,
    tanggal_tiba: shipment.tanggalTiba,
    waktu_tiba: shipment.waktuTiba,
    status: shipment.status,
    kendala: shipment.kendala,
    qty: shipment.qty,
    tracking_url: shipment.trackingUrl,
    current_lat: shipment.currentLat,
    current_lng: shipment.currentLng
  }));
  
  const { data, error } = await supabase
    .from('shipments')
    .insert(supabaseShipments)
    .select('*, drivers (id, name, license_plate)');

  if (error) {
    console.error('Error batch importing shipments:', error);
    throw error;
  }

  return (data as SupabaseShipment[]).map(mapSupabaseShipment);
};

// Get company summaries 
export const getCompanySummaries = async () => {
  const { data, error } = await supabase
    .rpc('get_company_summaries');

  if (error) {
    console.error('Error getting company summaries:', error);
    throw error;
  }

  return data;
};

// Subscribe to shipments changes
export const subscribeToShipments = (callback: (shipments: Shipment[]) => void) => {
  const channel = supabase
    .channel('public:shipments')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'shipments' 
    }, async () => {
      // When there's a change, fetch latest data and call callback
      const { data } = await supabase
        .from('shipments')
        .select('*, drivers (id, name, license_plate)')
        .order('tanggal_kirim', { ascending: false });
        
      if (data) {
        const shipments = (data as SupabaseShipment[]).map(mapSupabaseShipment);
        callback(shipments);
      }
    })
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};
