import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import NavigationBar from "../../components/ui/NavigationBar";
import BreadcrumbTrail from "../../components/ui/BreadcrumbTrail";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { API_BASE_URL, getStoredToken, clearStoredToken } from "../../utils/api";
import { toast } from "react-toastify";

const KycPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
    address: "",
    documentType: "passport",
    documentNumber: "",
    documentImage: null as File | null,
    selfieImage: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) {
      clearStoredToken();
      navigate("/login");
      return;
    }
    if (!form.documentImage) {
      setError("Document image is required.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("dateOfBirth", form.dateOfBirth);
      fd.append("country", form.country);
      fd.append("address", form.address);
      fd.append("documentType", form.documentType);
      fd.append("documentNumber", form.documentNumber);
      if (form.documentImage) fd.append("documentImage", form.documentImage);
      if (form.selfieImage) fd.append("selfieImage", form.selfieImage);

      const res = await fetch(`${API_BASE_URL}/kyc`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload?.errors || payload?.message || "Unable to submit KYC.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("KYC submitted. Status: pending.");
      navigate("/dashboard");
    } catch (_err) {
      setError("Unable to submit KYC.");
      toast.error("Unable to submit KYC.");
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "KYC" },
  ];

  return (
    <>
      <Helmet>
        <title>KYC Verification - TrustPay</title>
        <meta name="description" content="Complete your KYC to enable banking features." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <NavigationBar onNavigate={(path) => navigate(path)} />
        <main className="pt-nav-height">
          <div className="px-nav-margin py-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <BreadcrumbTrail items={breadcrumbItems} />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Verify your identity</h1>
                <p className="text-muted-foreground">
                  Provide your details and document images to complete KYC.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="First Name" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} required />
                  <Input label="Last Name" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} required />
                </div>
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} required />
                <Input
                  label="Country (ISO code)"
                  value={form.country}
                  maxLength={3}
                  onChange={(e) => handleChange("country", e.target.value.toUpperCase())}
                  required
                  description="Use 2-letter ISO code (e.g., US, UK)"
                />
                <Input label="Address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Document Type</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.documentType}
                      onChange={(e) => handleChange("documentType", e.target.value)}
                    >
                      <option value="passport">Passport</option>
                      <option value="national_id">National ID</option>
                      <option value="driver_license">Driver License</option>
                    </select>
                  </div>
                  <Input
                    label="Document Number"
                    value={form.documentNumber}
                    onChange={(e) => handleChange("documentNumber", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Document Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("documentImage", e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Selfie Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("selfieImage", e.target.files?.[0] || null)}
                  />
                </div>
                {error && (
                  <div className="text-sm text-error border border-error/20 bg-error/5 rounded-md p-3">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Submit KYC
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default KycPage;
