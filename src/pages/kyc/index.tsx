import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { City, Country, State, type ICity, type ICountry, type IState } from "country-state-city";
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
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    country: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    documentType: "passport",
    documentNumber: "",
    documentImage: null as File | null,
    documentBackImage: null as File | null,
    selfieImage: null as File | null,
  });
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (!form.country) {
      setStates([]);
      setCities([]);
      setForm((prev) => ({ ...prev, state: "", city: "" }));
      return;
    }
    const nextStates = State.getStatesOfCountry(form.country) || [];
    setStates(nextStates);
    setCities([]);
    setForm((prev) => ({ ...prev, state: "", city: "" }));
  }, [form.country]);

  useEffect(() => {
    if (!form.country || !form.state) {
      setCities([]);
      return;
    }
    const nextCities = City.getCitiesOfState(form.country, form.state) || [];
    setCities(nextCities);
    setForm((prev) => ({ ...prev, city: "" }));
  }, [form.country, form.state]);

  const handleCountrySelect = (value: string) => {
    handleChange("country", value);
  };

  const handleStateSelect = (value: string) => {
    handleChange("state", value);
  };

  const handleCitySelect = (value: string) => {
    handleChange("city", value);
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
    if (!form.dobDay || !form.dobMonth || !form.dobYear) {
      setError("Complete date of birth.");
      return;
    }
    if (!form.country || !form.state || !form.city) {
      setError("Country, state, and city are required.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("dateOfBirth[day]", form.dobDay);
      fd.append("dateOfBirth[month]", form.dobMonth);
      fd.append("dateOfBirth[year]", form.dobYear);
      fd.append("country", form.country);
      fd.append("addressLine1", form.addressLine1);
      if (form.addressLine2) fd.append("addressLine2", form.addressLine2);
      fd.append("city", form.city);
      fd.append("state", form.state);
      fd.append("postalCode", form.postalCode);
      fd.append("documentType", form.documentType);
      fd.append("documentNumber", form.documentNumber);
      if (form.documentImage) fd.append("documentImage", form.documentImage);
      if (form.documentBackImage) fd.append("documentBackImage", form.documentBackImage);
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
            <div className="max-w-7xl mx-auto space-y-6">
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
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Day" type="number" min={1} max={31} value={form.dobDay} onChange={(e) => handleChange("dobDay", e.target.value)} required />
                  <Input label="Month" type="number" min={1} max={12} value={form.dobMonth} onChange={(e) => handleChange("dobMonth", e.target.value)} required />
                  <Input label="Year" type="number" min={1900} max={9999} value={form.dobYear} onChange={(e) => handleChange("dobYear", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Country</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.country}
                    onChange={(e) => handleCountrySelect(e.target.value)}
                    required
                  >
                    <option value="">Select a country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>
                        {c.name} ({c.isoCode})
                      </option>
                    ))}
                  </select>
                </div>
                <Input label="Address Line 1" value={form.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} required />
                <Input label="Address Line 2 (optional)" value={form.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} />
                {/* <Input label="ssn (optional for US citizen only)" type="number" /> */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">State / Province</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.state}
                      onChange={(e) => handleStateSelect(e.target.value)}
                      disabled={!form.country}
                      required
                    >
                      <option value="">{form.country ? "Select a state" : "Select country first"}</option>
                      {states.map((s) => (
                        <option key={`${s.isoCode}-${s.name}`} value={s.isoCode}>
                          {s.name} ({s.isoCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">City</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.city}
                      onChange={(e) => handleCitySelect(e.target.value)}
                      disabled={!form.state}
                      required
                    >
                      <option value="">{form.state ? "Select a city" : "Select state first"}</option>
                      {cities.map((c) => {
                        const key = `${c.countryCode}-${c.stateCode}-${c.name}`;
                        return (
                          <option key={key} value={c.name}>
                            {c.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <Input label="Postal Code" value={form.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} required />
                </div>
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
                  <label className="text-sm font-medium text-foreground">Document Image (front)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("documentImage", e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Document Image (back, optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("documentBackImage", e.target.files?.[0] || null)}
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
