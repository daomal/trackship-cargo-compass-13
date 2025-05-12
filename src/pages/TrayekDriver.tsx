
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface DriverRoute {
  id: string;
  name: string;
  route: string;
  distance: string;
  frequency: string;
  status: "aktif" | "non-aktif";
}

const driverRoutes: DriverRoute[] = [
  {
    id: "1",
    name: "Budi Santoso",
    route: "Jakarta - Bandung",
    distance: "150 km",
    frequency: "Harian",
    status: "aktif"
  },
  {
    id: "2",
    name: "Agus Prayitno",
    route: "Jakarta - Semarang",
    distance: "450 km",
    frequency: "2x Seminggu",
    status: "aktif"
  },
  {
    id: "3",
    name: "Dedi Kurniawan",
    route: "Jakarta - Surabaya",
    distance: "780 km",
    frequency: "Mingguan",
    status: "aktif"
  },
  {
    id: "4",
    name: "Eko Prasetyo",
    route: "Jakarta - Lampung",
    distance: "220 km",
    frequency: "3x Seminggu",
    status: "non-aktif"
  },
  {
    id: "5",
    name: "Joko Widodo",
    route: "Jakarta - Yogyakarta",
    distance: "450 km",
    frequency: "2x Seminggu",
    status: "aktif"
  },
  {
    id: "6",
    name: "Rudi Setiawan",
    route: "Jakarta - Solo",
    distance: "490 km",
    frequency: "Mingguan",
    status: "aktif"
  },
  {
    id: "7",
    name: "Bambang Subroto",
    route: "Jakarta - Malang",
    distance: "830 km",
    frequency: "Bulanan",
    status: "non-aktif"
  },
  {
    id: "8",
    name: "Hadi Purnomo",
    route: "Jakarta - Cirebon",
    distance: "240 km",
    frequency: "2x Seminggu",
    status: "aktif"
  }
];

const TrayekDriver = () => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter driver routes based on search term
  const filteredRoutes = driverRoutes.filter(route => 
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Trayek Driver</h1>
          <p className="text-gray-700">Informasi rute dan trayek pengemudi</p>
        </div>
        
        <Button variant="outline" asChild className="bg-white/90 text-purple-700 hover:bg-purple-50 hover:shadow-md transition-all duration-300 border-purple-200">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-white to-purple-100 border border-purple-200 shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="text-purple-900">Data Trayek Driver</CardTitle>
          <CardDescription className="text-purple-700">
            Daftar rute dan trayek yang dikerjakan oleh pengemudi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Cari driver atau rute..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 p-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          
          <div className="rounded-md border border-purple-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-purple-100">
                  <TableRow>
                    <TableHead className="text-purple-900">No.</TableHead>
                    <TableHead className="text-purple-900">Nama Driver</TableHead>
                    <TableHead className="text-purple-900">Rute</TableHead>
                    {!isMobile && (
                      <>
                        <TableHead className="text-purple-900">Jarak</TableHead>
                        <TableHead className="text-purple-900">Frekuensi</TableHead>
                      </>
                    )}
                    <TableHead className="text-purple-900">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((route, index) => (
                    <TableRow key={route.id} className="bg-white hover:bg-purple-50">
                      <TableCell className="text-black font-medium">{index + 1}</TableCell>
                      <TableCell className="text-black">{route.name}</TableCell>
                      <TableCell className="text-black">{route.route}</TableCell>
                      {!isMobile && (
                        <>
                          <TableCell className="text-black">{route.distance}</TableCell>
                          <TableCell className="text-black">{route.frequency}</TableCell>
                        </>
                      )}
                      <TableCell>
                        {route.status === "aktif" ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>
                        ) : (
                          <Badge className="bg-gray-500 hover:bg-gray-600">Non-aktif</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRoutes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 4 : 6} className="text-center py-4 text-purple-700">
                        Tidak ada data trayek yang sesuai dengan pencarian
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-purple-100 border border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-purple-900">Informasi Trayek</CardTitle>
          <CardDescription className="text-purple-700">
            Penjelasan mengenai sistem trayek pengiriman
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-black">
            <p>
              Trayek driver merupakan rute tetap yang dilalui oleh para pengemudi dalam melakukan pengiriman barang.
              Setiap driver memiliki rute yang sudah ditentukan dengan frekuensi pengiriman yang berbeda-beda sesuai
              dengan kebutuhan operasional.
            </p>
            <p>
              Penentuan trayek mempertimbangkan berbagai faktor seperti jarak tempuh, kondisi jalan, volume
              pengiriman, dan ketersediaan driver. Status trayek dapat berubah menjadi non-aktif jika terdapat
              perubahan kondisi atau kebutuhan operasional.
            </p>
            <p>
              Untuk informasi lebih lanjut atau permintaan perubahan trayek, silakan hubungi bagian
              operasional perusahaan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrayekDriver;
