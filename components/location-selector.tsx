"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"

interface LocationSelectorProps {
  onLocationChange: (location: string) => void
  defaultValue?: string
}

// Türkiye illeri
const cities = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Amasya",
  "Ankara",
  "Antalya",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Isparta",
  "Mersin",
  "İstanbul",
  "İzmir",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Kahramanmaraş",
  "Mardin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Şanlıurfa",
  "Uşak",
  "Van",
  "Yozgat",
  "Zonguldak",
  "Aksaray",
  "Bayburt",
  "Karaman",
  "Kırıkkale",
  "Batman",
  "Şırnak",
  "Bartın",
  "Ardahan",
  "Iğdır",
  "Yalova",
  "Karabük",
  "Kilis",
  "Osmaniye",
  "Düzce",
]

// İlçeler için örnek veri (gerçek API ile değiştirilecek)
const districts: Record<string, string[]> = {
  İstanbul: [
    "Adalar",
    "Arnavutköy",
    "Ataşehir",
    "Avcılar",
    "Bağcılar",
    "Bahçelievler",
    "Bakırköy",
    "Başakşehir",
    "Bayrampaşa",
    "Beşiktaş",
    "Beykoz",
    "Beylikdüzü",
    "Beyoğlu",
    "Büyükçekmece",
    "Çatalca",
    "Çekmeköy",
    "Esenler",
    "Esenyurt",
    "Eyüpsultan",
    "Fatih",
    "Gaziosmanpaşa",
    "Güngören",
    "Kadıköy",
    "Kağıthane",
    "Kartal",
    "Küçükçekmece",
    "Maltepe",
    "Pendik",
    "Sancaktepe",
    "Sarıyer",
    "Silivri",
    "Sultanbeyli",
    "Sultangazi",
    "Şile",
    "Şişli",
    "Tuzla",
    "Ümraniye",
    "Üsküdar",
    "Zeytinburnu",
  ],
  Ankara: [
    "Altındağ",
    "Çankaya",
    "Etimesgut",
    "Keçiören",
    "Mamak",
    "Sincan",
    "Yenimahalle",
    "Akyurt",
    "Ayaş",
    "Bala",
    "Beypazarı",
    "Çamlıdere",
    "Çubuk",
    "Elmadağ",
    "Evren",
    "Gölbaşı",
    "Güdül",
    "Haymana",
    "Kalecik",
    "Kazan",
    "Kızılcahamam",
    "Nallıhan",
    "Polatlı",
    "Şereflikoçhisar",
  ],
  İzmir: [
    "Aliağa",
    "Balçova",
    "Bayındır",
    "Bayraklı",
    "Bergama",
    "Beydağ",
    "Bornova",
    "Buca",
    "Çeşme",
    "Çiğli",
    "Dikili",
    "Foça",
    "Gaziemir",
    "Güzelbahçe",
    "Karabağlar",
    "Karaburun",
    "Karşıyaka",
    "Kemalpaşa",
    "Kınık",
    "Kiraz",
    "Konak",
    "Menderes",
    "Menemen",
    "Narlıdere",
    "Ödemiş",
    "Seferihisar",
    "Selçuk",
    "Tire",
    "Torbalı",
    "Urla",
  ],
}

export function LocationSelector({ onLocationChange, defaultValue = "" }: LocationSelectorProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"city" | "district">(defaultValue ? "district" : "city")

  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue)
      // Eğer varsayılan değer "İl, İlçe" formatındaysa parçalara ayır
      const parts = defaultValue.split(", ")
      if (parts.length === 2) {
        setSelectedCity(parts[0])
        setSelectedDistrict(parts[1])
        setStep("district")
      }
    }
  }, [defaultValue])

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setSelectedCity(null)
    setSelectedDistrict(null)
    setStep("city")

    if (value.length > 1) {
      const filtered = cities.filter((city) => city.toLowerCase().includes(value.toLowerCase()))
      setCitySuggestions(filtered)
      setShowCitySuggestions(filtered.length > 0)
    } else {
      setCitySuggestions([])
      setShowCitySuggestions(false)
    }
  }

  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setInputValue(city)
    setCitySuggestions([])
    setShowCitySuggestions(false)
    setStep("district")

    // İlçeleri yükle
    setIsLoading(true)
    setTimeout(() => {
      if (districts[city]) {
        setDistrictSuggestions(districts[city])
        setShowDistrictSuggestions(true)
      } else {
        setDistrictSuggestions([])
      }
      setIsLoading(false)
    }, 500)
  }

  const handleDistrictInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(`${selectedCity}, `, "")
    setSelectedDistrict(null)

    if (selectedCity) {
      setInputValue(`${selectedCity}, ${value}`)

      if (value.length > 0 && districts[selectedCity]) {
        const filtered = districts[selectedCity].filter((district) =>
          district.toLowerCase().includes(value.toLowerCase()),
        )
        setDistrictSuggestions(filtered)
        setShowDistrictSuggestions(filtered.length > 0)
      } else {
        setDistrictSuggestions(districts[selectedCity] || [])
        setShowDistrictSuggestions(districts[selectedCity]?.length > 0 || false)
      }
    }
  }

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district)
    const fullLocation = `${selectedCity}, ${district}`
    setInputValue(fullLocation)
    setDistrictSuggestions([])
    setShowDistrictSuggestions(false)
    onLocationChange(fullLocation)
  }

  const handleInputFocus = () => {
    if (step === "city") {
      if (inputValue.length > 1) {
        const filtered = cities.filter((city) => city.toLowerCase().includes(inputValue.toLowerCase()))
        setCitySuggestions(filtered)
        setShowCitySuggestions(filtered.length > 0)
      } else {
        setCitySuggestions(cities.slice(0, 10))
        setShowCitySuggestions(true)
      }
    } else if (step === "district" && selectedCity) {
      const value = inputValue.replace(`${selectedCity}, `, "")
      if (value.length > 0 && districts[selectedCity]) {
        const filtered = districts[selectedCity].filter((district) =>
          district.toLowerCase().includes(value.toLowerCase()),
        )
        setDistrictSuggestions(filtered)
      } else {
        setDistrictSuggestions(districts[selectedCity] || [])
      }
      setShowDistrictSuggestions(districts[selectedCity]?.length > 0 || false)
    }
  }

  return (
    <div className="relative">
      <Label htmlFor="location">Konum</Label>
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        {isLoading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
        <Input
          id="location"
          placeholder={step === "city" ? "Önce şehir seçin" : "İlçe seçin"}
          value={inputValue}
          onChange={step === "city" ? handleCityInputChange : handleDistrictInputChange}
          onFocus={handleInputFocus}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking on them
            setTimeout(() => {
              setShowCitySuggestions(false)
              setShowDistrictSuggestions(false)
            }, 200)
          }}
          className="pl-8"
        />
      </div>

      {/* Şehir önerileri */}
      {showCitySuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {citySuggestions.length === 0 ? (
            <div className="px-4 py-2 text-muted-foreground">Sonuç bulunamadı</div>
          ) : (
            citySuggestions.map((city) => (
              <div
                key={city}
                className="px-4 py-2 hover:bg-muted cursor-pointer"
                onMouseDown={() => handleCitySelect(city)}
              >
                {city}
              </div>
            ))
          )}
        </div>
      )}

      {/* İlçe önerileri */}
      {showDistrictSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {districtSuggestions.length === 0 ? (
            <div className="px-4 py-2 text-muted-foreground">Sonuç bulunamadı</div>
          ) : (
            districtSuggestions.map((district) => (
              <div
                key={district}
                className="px-4 py-2 hover:bg-muted cursor-pointer"
                onMouseDown={() => handleDistrictSelect(district)}
              >
                {district}
              </div>
            ))
          )}
        </div>
      )}

      {selectedCity && !selectedDistrict && (
        <p className="text-xs text-muted-foreground mt-1">{selectedCity} için ilçe seçin</p>
      )}
    </div>
  )
}

export default LocationSelector
