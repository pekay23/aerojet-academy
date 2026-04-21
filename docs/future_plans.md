# Future Plans: Academy Class Management Redesign

This document outlines the strategic roadmap for enhancing the Class Management system in the Staff Portal.

## 1. Student & Batch Enrollment
- **Batch Selection**: Implement a bulk-selection interface to enroll entire batches (Academic Year + Semester cohorts) into a class in one action.
- **Roster Management**: Comprehensive student list view within each class with status tracking (Enrolled, Dropped, Completed).
- **Auto-Enrollment Logic**: Link classes to specific student qualifications or pathway requirements.

## 2. Pathway & Academic Context
- **Pathway Constraints**: Restrict class visibility or enrollment based on the student's assigned `StudyPathway`.
- **Pre-requisite Validation**: Automatic checking if students meet the course requirements before allowing class assignment.

## 3. Physical Resource Management
- **Classroom Mapping**: Assign classes to specific physical rooms or labs in the academy.
- **Capacity Enforcement**: Real-time validation of `maxStudents` against physical room seating capacity.
- **Seating Arrangements**:
    - Interactive floor plan / seating chart designer.
    - Drag-and-drop student assignment to specific desks.
    - Visual occupancy heatmaps.

## 4. Enhanced Scheduling
- **Weekly Schedule UI**: Replace JSON configuration with a visual calendar/grid picker for daily instruction hours.
- **Conflict Detection**: Prevent overlapping instructor or room usage across different classes.
- **Holiday/Break Exclusion**: Automatically exclude academy holidays from the session count.

## 📈 5. Advanced Analytics
- **Predictive Analytics**: Forecasting revenue based on historical exam enrollment trends.
- **Automated Reporting**: Scheduled PDF reports for board members (Revenue, Enrollment, Attendance).
- **Performance Benchmarking**: Comparing current month performance against previous years automatically in the UI.
