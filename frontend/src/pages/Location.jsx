import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useLocation } from "../context/LocationContext";



const SAVED_LOCATIONS = [

  {

    id: "home",

    label: "Home",

    address: "123 Green Street, Apartment 4B",

    pincode: "400001",

  },

  {

    id: "work",

    label: "Work",

    address: "Tech Park, Building C, Floor 5",

    pincode: "400076",

  },

  {

    id: "other",

    label: "Other",

    address: "Near City Mall, Main Road",

    pincode: "400053",

  },

];



function Location() {

  const navigate = useNavigate();

  const { setLocation } = useLocation();

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState("home");



  const confirm = () => {

    const loc = SAVED_LOCATIONS.find((l) => l.id === selected) || SAVED_LOCATIONS[0];

    setLocation({

      label: loc.label,

      address: loc.address,

      pincode: loc.pincode,

    });

    navigate("/", { replace: true });

  };



  const filtered = SAVED_LOCATIONS.filter(

    (loc) =>

      !search.trim() ||

      loc.label.toLowerCase().includes(search.toLowerCase()) ||

      loc.address.toLowerCase().includes(search.toLowerCase())

  );



  return (

    <div className="min-h-screen bg-mobile-bg pb-8 lg:flex lg:items-start lg:justify-center lg:bg-gradient-to-b lg:from-primary-light/20 lg:to-mobile-bg lg:px-8 lg:py-12">

      <div className="w-full lg:max-w-xl lg:overflow-hidden lg:rounded-3xl lg:border lg:border-border-light lg:bg-white lg:shadow-xl lg:shadow-primary/5">

        <div className="sticky top-0 z-10 border-b border-border-light bg-white px-4 py-4 sm:px-6 lg:static lg:px-8 lg:pt-8">

          <div className="flex items-center gap-3">

            <button

              type="button"

              onClick={() => navigate(-1)}

              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-primary transition hover:bg-mobile-surface"

              aria-label="Go back"

            >

              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>

                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />

              </svg>

            </button>

            <div>

              <h1 className="text-lg font-bold text-text-primary lg:text-xl">Select Location</h1>

              <p className="hidden text-sm text-text-secondary lg:block">

                Choose where we should deliver your groceries

              </p>

            </div>

          </div>



          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border-light bg-mobile-surface px-3 py-2.5 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">

            <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>

              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

            </svg>

            <input

              type="search"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Search for area, street name..."

              className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"

            />

          </div>

        </div>



        <div className="px-4 py-4 sm:px-6 lg:px-8 lg:pb-8">

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">

            Saved Locations

          </p>

          <ul className="space-y-2">

            {filtered.map((loc) => (

              <li key={loc.id}>

                <button

                  type="button"

                  onClick={() => setSelected(loc.id)}

                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${

                    selected === loc.id

                      ? "border-primary bg-primary-light/50 shadow-sm"

                      : "border-border-light bg-white hover:border-primary/40 hover:shadow-sm"

                  }`}

                >

                  <span

                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${

                      selected === loc.id ? "border-primary" : "border-border-light"

                    }`}

                  >

                    {selected === loc.id ? (

                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />

                    ) : null}

                  </span>

                  <div className="min-w-0">

                    <p className="font-bold text-text-primary">{loc.label}</p>

                    <p className="mt-0.5 text-sm text-text-secondary">{loc.address}</p>

                    <p className="mt-1 text-xs text-text-muted">PIN: {loc.pincode}</p>

                  </div>

                </button>

              </li>

            ))}

          </ul>



          {filtered.length === 0 ? (

            <p className="py-8 text-center text-sm text-text-muted">No locations match your search.</p>

          ) : null}



          <button

            type="button"

            onClick={confirm}

            className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark lg:py-4"

          >

            Confirm Location

          </button>

        </div>

      </div>

    </div>

  );

}



export default Location;

