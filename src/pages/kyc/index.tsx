import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { City, Country, State, type ICity, type ICountry, type IState } from "country-state-city";
import { useTranslation } from "react-i18next";
import NavigationBar from "../../components/ui/NavigationBar";
import BreadcrumbTrail from "../../components/ui/BreadcrumbTrail";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { API_BASE_URL, getStoredToken, clearStoredToken } from "../../utils/api";
import { toast } from "react-toastify";
import { apiFetch } from "utils/apiFetch";

const KycPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("kyc");
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
      setError(t("messages.error.documentImageRequired"));
      return;
    }
    if (!form.dobDay || !form.dobMonth || !form.dobYear) {
      setError(t("messages.error.dobIncomplete"));
      return;
    }
    if (!form.country || !form.state || !form.city) {
      setError(t("messages.error.locationRequired"));
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

      const res = await apiFetch(`${API_BASE_URL}/kyc`, {
        method: "POST",
        body: fd,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload?.errors || payload?.message || t("messages.error.submitFailed");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(t("messages.success"));
      navigate("/dashboard");
    } catch (_err) {
      const msg = t("messages.error.submitFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: t("breadcrumb.dashboard"), path: "/dashboard" },
    { label: t("breadcrumb.kyc") },
  ];

  return (
    <>
      <Helmet>
        <title>{t("meta.title")}</title>
        <meta name="description" content={t("meta.description")} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <NavigationBar onNavigate={(path) => navigate(path)} />
        <main className="pt-nav-height">
          <div className="px-nav-margin py-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <BreadcrumbTrail items={breadcrumbItems} />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("hero.title")}</h1>
                <p className="text-muted-foreground">{t("hero.subtitle")}</p>
              </div>
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t("form.firstName")} value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} required />
                  <Input label={t("form.lastName")} value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label={t("form.dob.day")} type="number" min={1} max={31} value={form.dobDay} onChange={(e) => handleChange("dobDay", e.target.value)} required />
                  <Input label={t("form.dob.month")} type="number" min={1} max={12} value={form.dobMonth} onChange={(e) => handleChange("dobMonth", e.target.value)} required />
                  <Input label={t("form.dob.year")} type="number" min={1900} max={9999} value={form.dobYear} onChange={(e) => handleChange("dobYear", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("form.country.label")}</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.country}
                    onChange={(e) => handleCountrySelect(e.target.value)}
                    required
                  >
                    <option value="">{t("form.country.placeholder")}</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>
                        {c.name} ({c.isoCode})
                      </option>
                    ))}
                  </select>
                </div>
                <Input label={t("form.addressLine1")} value={form.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} required />
                <Input label={t("form.addressLine2")} value={form.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} />
                {/* <Input label="ssn (optional for US citizen only)" type="number" /> */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("form.state.label")}</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.state}
                      onChange={(e) => handleStateSelect(e.target.value)}
                      disabled={!form.country}
                      required
                    >
                      <option value="">{form.country ? t("form.state.placeholder") : t("form.state.placeholderDisabled")}</option>
                      {states.map((s) => (
                        <option key={`${s.isoCode}-${s.name}`} value={s.isoCode}>
                          {s.name} ({s.isoCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("form.city.label")}</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.city}
                      onChange={(e) => handleCitySelect(e.target.value)}
                      disabled={!form.state}
                      required
                    >
                      <option value="">{form.state ? t("form.city.placeholder") : t("form.city.placeholderDisabled")}</option>
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
                  <Input label={t("form.postalCode")} value={form.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("form.documentType.label")}</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.documentType}
                      onChange={(e) => handleChange("documentType", e.target.value)}
                    >
                      <option value="passport">{t("form.documentType.options.passport")}</option>
                      <option value="national_id">{t("form.documentType.options.national_id")}</option>
                      <option value="driver_license">{t("form.documentType.options.driver_license")}</option>
                    </select>
                  </div>
                  <Input
                    label={t("form.documentNumber")}
                    value={form.documentNumber}
                    onChange={(e) => handleChange("documentNumber", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("form.documentImageFront")}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("documentImage", e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("form.documentImageBack")}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("documentBackImage", e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("form.selfieImage")}</label>
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
                    {t("form.cancel")}
                  </Button>
                  <Button type="submit" loading={submitting}>
                    {t("form.submit")}
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
