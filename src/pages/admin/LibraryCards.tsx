import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Download, CreditCard, RefreshCw, Search, CheckCircle, FileSpreadsheet } from "lucide-react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import collegeLogo from "@/assets/images/college-logo.png";

const getQRCodeUrl = (text: string, size: number = 100) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

interface LibraryCardApplication {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  dob: string | null;
  class: string;
  field: string | null;
  rollNo: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  status: string;
  cardNumber: string;
  studentId: string | null;
  issueDate: string | null;
  validThrough: string | null;
  createdAt: string;
}

const getFieldCode = (field: string): string => {
  const fieldCodeMap: Record<string, string> = {
    "Computer Science": "CS",
    "Commerce": "COM",
    "Humanities": "HM",
    "Pre-Engineering": "PE",
    "Pre-Medical": "PM"
  };
  return fieldCodeMap[field] || "XX";
};

const LibraryCards = () => {
  const [applications, setApplications] = useState<LibraryCardApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/library-card-applications', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data || []);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiRequest('PATCH', `/api/library-card-applications/${id}/status`, { status });
      if (res.ok) {
        const updatedApp = await res.json();
        setApplications(prev => prev.map(app => app.id === id ? updatedApp : app));

        if (status === 'approved') {
          toast({
            title: "Library Card Approved Successfully",
            description: `The library card for ${updatedApp.firstName} ${updatedApp.lastName} is now active.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Status Updated",
            description: `Application status changed to ${status}.`,
          });
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      await apiRequest('DELETE', `/api/library-card-applications/${id}`, {});
      setApplications(applications.filter(app => app.id !== id));
      toast({
        title: "Deleted",
        description: "Application has been deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = async (app: LibraryCardApplication) => {
    const doc = new jsPDF();

    const qrDestination = `https://gcmn-library.replit.dev/library-card/${app.cardNumber}`;
    const qrCodeUrl = getQRCodeUrl(qrDestination, 100);
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();
    const qrCodeDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = collegeLogo;

    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = logoImg.width;
    canvas.height = logoImg.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(logoImg, 0, 0);
    const logoDataUrl = canvas.toDataURL('image/jpeg', 0.6);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(22, 78, 59);
    doc.setLineWidth(2);
    doc.roundedRect(15, 15, 180, 120, 5, 5, "FD");

    doc.setFillColor(22, 78, 59);
    doc.rect(15, 15, 180, 35, "F");

    doc.addImage(logoDataUrl, "JPEG", 20, 17, 30, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Government of Sindh", 125, 22, { align: "center" });
    doc.text("College Education Department", 125, 27, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("GOVT COLLEGE FOR MEN NAZIMABAD", 125, 37, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(22, 78, 59);
    doc.text("LIBRARY CARD", 105, 57, { align: "center" });

    doc.setDrawColor(22, 78, 59);
    doc.setLineWidth(0.5);
    doc.line(25, 60, 185, 60);

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");

    const leftX = 25;
    let y = 68;
    const lineHeight = 7;

    doc.setFont("helvetica", "bold");
    doc.text("Name:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${app.firstName} ${app.lastName}`, leftX + 25, y);
    y += lineHeight;

    if (app.fatherName) {
      doc.setFont("helvetica", "bold");
      doc.text("Father Name:", leftX, y);
      doc.setFont("helvetica", "normal");
      doc.text(app.fatherName, leftX + 32, y);
      y += lineHeight;
    }

    if (app.dob) {
      doc.setFont("helvetica", "bold");
      doc.text("Date of Birth:", leftX, y);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(app.dob).toLocaleDateString('en-GB'), leftX + 32, y);
      y += lineHeight;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Class:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(app.class, leftX + 18, y);
    y += lineHeight;

    if (app.field) {
      doc.setFont("helvetica", "bold");
      doc.text("Field/Group:", leftX, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${app.field} (${getFieldCode(app.field)})`, leftX + 28, y);
      y += lineHeight;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Roll Number:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(app.rollNo, leftX + 28, y);

    const rightX = 115;
    y = 68;

    doc.setFont("helvetica", "bold");
    doc.text("Library Card ID:", rightX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(22, 78, 59);
    doc.setFontSize(10);
    doc.text(app.cardNumber, rightX + 35, y);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    y += lineHeight;

    if (app.studentId) {
      doc.setFont("helvetica", "bold");
      doc.text("Student ID:", rightX, y);
      doc.setFont("helvetica", "normal");
      doc.text(app.studentId, rightX + 25, y);
      y += lineHeight;
    }

    if (app.issueDate) {
      doc.setFont("helvetica", "bold");
      doc.text("Issue Date:", rightX, y);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(app.issueDate).toLocaleDateString('en-GB'), rightX + 25, y);
      y += lineHeight;
    }

    if (app.validThrough) {
      doc.setFont("helvetica", "bold");
      doc.text("Valid Through:", rightX, y);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(app.validThrough).toLocaleDateString('en-GB'), rightX + 30, y);
    }

    doc.addImage(qrCodeDataUrl, "JPEG", 150, 92, 30, 30, undefined, "FAST");

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(25, 125, 70, 125);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Principal's Signature", 47.5, 130, { align: "center" });

    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(22, 78, 59);
    doc.setLineWidth(2);
    doc.roundedRect(15, 150, 180, 80, 5, 5, "FD");

    doc.setFillColor(22, 78, 59);
    doc.rect(15, 150, 180, 15, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITIONS", 105, 159, { align: "center" });

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const disclaimerY = 172;
    const disclaimerLines = [
      "This card is NOT TRANSFERABLE.",
      "If lost, stolen, or damaged, report immediately to the GCMN Library.",
      "The college is not responsible for misuse.",
      "If found, please return to Government College for Men Nazimabad.",
      "",
      "Contact: Library, GCMN, Nazimabad, Karachi",
      "Email: library@gcmn.edu.pk"
    ];

    disclaimerLines.forEach((line, index) => {
      doc.text(line, 25, disclaimerY + (index * 7));
    });

    // Add approval message footer
    doc.setFillColor(255, 243, 224); // Light orange background
    doc.setDrawColor(230, 126, 34); // Orange border
    doc.setLineWidth(1);
    doc.rect(15, 240, 180, 25, "FD");

    doc.setTextColor(230, 126, 34);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("⏱ APPROVAL MESSAGE", 20, 248);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Wait 24 hours after application submission for admin approval.", 20, 255);
    doc.text("Then you can use your Library Card ID for login.", 20, 261);

    doc.save(`library-card-${app.cardNumber}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const downloadExcel = () => {
    if (filteredApplications.length === 0) {
      toast({
        title: "No Data",
        description: "No library card entries to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = filteredApplications.map((app, index) => ({
      "Serial No": index + 1,
      "Library Card ID": app.cardNumber,
      "Student Name": `${app.firstName} ${app.lastName}`,
      "Father Name": app.fatherName || "-",
      "Date of Birth": app.dob ? new Date(app.dob).toLocaleDateString("en-GB") : "-",
      "Email Address": app.email || "-",
      "Phone Number": app.phone || "-",
      "Street Address": app.addressStreet || "-",
      "Status": app.status.charAt(0).toUpperCase() + app.status.slice(1),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 22 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Library Cards");
    XLSX.writeFile(workbook, "library_cards.xlsx");

    toast({
      title: "Success",
      description: `Downloaded Excel file with ${filteredApplications.length} library card entries.`,
    });
  };

  const generateBulkPDF = () => {
    if (filteredApplications.length === 0) {
      toast({
        title: "No Data",
        description: "No library card entries to download.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4", true); // Enable compression

    doc.setFillColor(22, 78, 59);
    doc.rect(0, 0, 297, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GCMN Library - Library Card Applications Report", 148.5, 12, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148.5, 17, { align: "center" });

    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const rowHeight = 7;
    const colWidths = [12, 22, 25, 22, 18, 22, 18, 22, 25, 18];
    const columns = ["S.No", "Card ID", "Student Name", "Father Name", "DOB", "Email", "Phone", "Address", "Status", "Date"];

    // Table header
    doc.setFillColor(200, 220, 200);
    doc.setTextColor(22, 78, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let x = margin;
    columns.forEach((col, i) => {
      doc.text(col, x, y, { maxWidth: colWidths[i] - 2 });
      x += colWidths[i];
    });

    y += rowHeight;
    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y - 2, 287 - margin, y - 2);

    // Table rows
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    filteredApplications.forEach((app, index) => {
      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;

        // Repeat header on new page
        doc.setFillColor(200, 220, 200);
        doc.setTextColor(22, 78, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);

        x = margin;
        columns.forEach((col, i) => {
          doc.text(col, x, y, { maxWidth: colWidths[i] - 2 });
          x += colWidths[i];
        });

        y += rowHeight;
        doc.setDrawColor(150, 150, 150);
        doc.line(margin, y - 2, 287 - margin, y - 2);

        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
      }

      x = margin;
      const rowData = [
        (index + 1).toString(),
        app.cardNumber,
        `${app.firstName} ${app.lastName}`,
        app.fatherName || "-",
        app.dob ? new Date(app.dob).toLocaleDateString('en-GB') : "-",
        app.email || "-",
        app.phone || "-",
        `${app.addressStreet || ''} ${app.addressCity || ''}`.trim() || "-",
        app.status,
        new Date(app.createdAt).toLocaleDateString('en-GB')
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, y, { maxWidth: colWidths[i] - 2 });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    doc.save(`gcmn-library-cards-report-${new Date().getTime()}.pdf`);

    toast({
      title: "Success",
      description: `Downloaded PDF with ${filteredApplications.length} library card entries.`,
    });
  };

  const filteredApplications = applications.filter(app => {
    const search = searchQuery.toLowerCase();
    return (
      app.cardNumber.toLowerCase().includes(search) ||
      app.firstName.toLowerCase().includes(search) ||
      app.lastName.toLowerCase().includes(search) ||
      app.rollNo.toLowerCase().includes(search) ||
      app.email.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Library Card Applications</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, card ID, roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-applications"
                />
              </div>
              <Button variant="outline" onClick={downloadExcel} className="gap-2" data-testid="button-download-excel">
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </Button>
              <Button variant="outline" onClick={generateBulkPDF} className="gap-2" data-testid="button-download-bulk-pdf">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={fetchApplications} className="gap-2" data-testid="button-refresh-applications">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            {/* Removed CardHeader to match cleaner layout */}
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications found.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/40 rounded-t-lg border-b text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:grid">
                    <div className="col-span-4">Student Details</div>
                    <div className="col-span-2">Card ID</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  <div className="space-y-4">
                    {filteredApplications.map((app, index) => (
                      <div key={app.id} className="bg-white rounded-xl border shadow-sm group hover:shadow-md transition-all">
                        {/* Main Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center">
                          {/* Student Details */}
                          <div className="md:col-span-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {app.firstName.charAt(0)}{app.lastName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-neutral-900 truncate">{app.firstName} {app.lastName}</div>
                              <div className="text-xs text-muted-foreground font-medium truncate">
                                {app.fatherName ? `S/O: ${app.fatherName}` : 'Father name not provided'}
                              </div>
                            </div>
                          </div>

                          {/* Card ID */}
                          <div className="md:col-span-2 flex md:block items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground md:hidden">Card ID:</span>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1 hidden md:block">SN #{index + 1}</div>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-mono">
                                {app.cardNumber}
                              </Badge>
                            </div>
                          </div>

                          {/* Contact */}
                          <div className="md:col-span-3">
                            <div className="text-sm font-medium text-neutral-900 truncate" title={app.email}>{app.email || '-'}</div>
                            <div className="text-xs text-muted-foreground">{app.phone || '-'}</div>
                          </div>

                          {/* Status */}
                          <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-4">
                            <span className="text-xs font-bold text-muted-foreground md:hidden">Status:</span>
                            {app.status?.toLowerCase() === 'pending' ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="animate-pulse">Pending</Badge>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                                    onClick={() => updateStatus(app.id, 'approved')}
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                    onClick={() => updateStatus(app.id, 'rejected')}
                                    title="Reject"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : app.status?.toLowerCase() === 'approved' ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Approved</Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Rejected</Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="md:col-span-1 flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => generatePDF(app)}
                              className="h-8 w-8 text-neutral-400 hover:text-primary"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteApplication(app.id)}
                              className="h-8 w-8 text-neutral-400 hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Address Row - 1*5 Box (Full Width) */}
                        <div className="bg-white px-4 pb-4 pt-1">
                          <div className="flex items-start gap-2 pt-3 border-t border-dashed border-neutral-300">
                            <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">Address :</span>
                            <p className="text-sm text-neutral-600 font-medium leading-relaxed break-words w-full">
                              {[app.addressStreet, app.addressCity, app.addressState, app.addressZip].filter(Boolean).length > 0 ? (
                                <span>
                                  {[app.addressStreet, app.addressCity, app.addressState].filter(Boolean).join(", ")}
                                  {app.addressZip ? ` - ${app.addressZip}` : ''}
                                </span>
                              ) : (
                                <span className="text-neutral-400 italic">----------------------------------------------------</span>
                              )}
                            </p>
                          </div>
                        </div>


                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LibraryCards;
