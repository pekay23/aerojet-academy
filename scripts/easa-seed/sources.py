"""Source-of-truth PDF map for EASA Part-66 question bank.

Only Suntech-approved training books are authoritative.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

AEROJET_ROOT = Path(
    r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation"
)


@dataclass(frozen=True)
class ModuleSource:
    module_code: str  # "M1", "M2", ...
    folder: str       # folder name under AEROJET_ROOT
    textbook_pdfs: tuple[Path, ...]


# Order: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11A, 13, 14, 15, 17.
SOURCES: tuple[ModuleSource, ...] = (
    ModuleSource(
        "M1",
        "Module 1 - Mathematics",
        (AEROJET_ROOT / "Module 1 - Mathematics" / "suntech" / "M01-Training-book.pdf",),
    ),
    ModuleSource(
        "M2",
        "Module 2 - Physics",
        (AEROJET_ROOT / "Module 2 - Physics" / "suntech" / "M02-Training-book.pdf",),
    ),
    ModuleSource(
        "M3",
        "Module 3 - Electrical Fundamentals",
        (AEROJET_ROOT / "Module 3 - Electrical Fundamentals" / "suntech" / "M03-Training-book.pdf",),
    ),
    ModuleSource(
        "M4",
        "Module 4 - Electronic Fundamentals",
        (
            AEROJET_ROOT
            / "Module 4 - Electronic Fundamentals"
            / "suntech"
            / "M04-B2-Training-book.pdf",
        ),
    ),
    ModuleSource(
        "M5",
        "Module 5 - Digital Techniques (Electronic Instrument Systems)",
        (
            AEROJET_ROOT
            / "Module 5 - Digital Techniques (Electronic Instrument Systems)"
            / "suntech"
            / "M05-B2-Training-book.pdf",
        ),
    ),
    ModuleSource(
        "M6",
        "Module 6 - Materials and Hardware",
        (
            AEROJET_ROOT
            / "Module 6 - Materials and Hardware"
            / "suntech"
            / "M6 Materials and Hardware Highlighted.pdf",
        ),
    ),
    ModuleSource(
        "M7",
        "Module 7 - Maintenance Practices",
        (
            AEROJET_ROOT / "Module 7 - Maintenance Practices" / "suntech" / "M7 — Maintenance Practices.pdf",
            AEROJET_ROOT / "Module 7 - Maintenance Practices" / "suntech" / "M7 — Maintenance Practices_250624_103445.pdf",
            AEROJET_ROOT / "Module 7 - Maintenance Practices" / "suntech" / "M7cmp1 — Maintenance Practices.pdf",
        ),
    ),
    ModuleSource(
        "M8",
        "Module 8 - Aerodynamics",
        (
            AEROJET_ROOT / "Module 8 - Aerodynamics" / "suntech" / "EASA-Module-8-Aerodynamics.pdf",
        ),
    ),
    ModuleSource(
        "M9",
        "Module 9 - Human Factors",
        (
            AEROJET_ROOT / "Module 9 - Human Factors" / "suntech" / "EASA-Module-9a-Human-Factors-Complete.pdf",
        ),
    ),
    ModuleSource(
        "M10",
        "Module 10 - Aviation Legislation",
        (
            AEROJET_ROOT / "Module 10 - Aviation Legislation" / "suntech" / "EASA-Module-10-Aviation-Legislation.pdf",
        ),
    ),
    ModuleSource(
        "M11A",
        "Module 11A - Turbine Aeroplane Aerodynamics",
        (
            AEROJET_ROOT / "Module 11A - Turbine Aeroplane Aerodynamics" / "suntech" / "M11 - Turbine Aeroplane Aerodynamics.pdf",
            AEROJET_ROOT / "Module 11A - Turbine Aeroplane Aerodynamics" / "suntech" / "M11 - Turbine Aeroplane Aerodynamics comp.pdf",
            AEROJET_ROOT / "Module 11A - Turbine Aeroplane Aerodynamics" / "suntech" / "M11 - Turbine Aeroplane Aerodynamics non.pdf",
        ),
    ),
    ModuleSource(
        "M13",
        "Module 13 - Aircraft Aerodynamics, Structures & Systems",
        (
            AEROJET_ROOT / "Module 13 - Aircraft Aerodynamics, Structures & Systems" / "suntech" / "M13 — Aircraft Aerodynamics, Structures & Systems.pdf",
            AEROJET_ROOT / "Module 13 - Aircraft Aerodynamics, Structures & Systems" / "suntech" / "M13 — Aircraft Aerodynamics, Structures & Systems cmp.pdf",
        ),
    ),
    ModuleSource(
        "M14",
        "Module 14 - Propulsion",
        (
            AEROJET_ROOT / "Module 14 - Propulsion" / "suntech" / "Module 14.pdf",
        ),
    ),
    ModuleSource(
        "M15",
        "Module 15 - Gas Turbine Engines",
        (
            AEROJET_ROOT / "Module 15 - Gas Turbine Engines" / "suntech" / "Module 15.pdf",
            AEROJET_ROOT / "Module 15 - Gas Turbine Engines" / "suntech" / "Module 15 Highlighted.pdf",
        ),
    ),
    ModuleSource(
        "M17",
        "Module 17 - Propellers",
        (
            AEROJET_ROOT
            / "Module 17 - Propellers"
            / "suntech"
            / "M17-Training-book-B1.pdf",
        ),
    ),
)


def get_source(module_code: str) -> ModuleSource:
    for s in SOURCES:
        if s.module_code == module_code:
            return s
    raise KeyError(f"No source configured for {module_code}")
