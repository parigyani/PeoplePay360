import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  docTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  headerRight: {
    textAlign: 'right',
  },
  periodText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    marginTop: 4,
    backgroundColor: '#d1fae5',
    color: '#065f46',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 9,
    alignSelf: 'flex-end',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  col: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 80,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  colRuleName: { width: '40%' },
  colCategory: { width: '25%' },
  colCode: { width: '15%' },
  colAmount: { width: '20%', textAlign: 'right' },
  summaryBox: {
    width: '50%',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryNet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
  },
});

export const PayslipPDF = ({ payslip, employee, payrun, contract }: any) => {
  // Extract lines and sort/group them (basic parsing)
  // Assuming payslip.lines is an array of { code, name, amount }
  // We'll guess category by code for display if category isn't in lines
  const lines = Array.isArray(payslip.lines) ? payslip.lines : [];
  
  const earnings = lines.filter((l: any) => l.amount > 0 && l.code !== 'NET' && l.code !== 'GROSS');
  const deductions = lines.filter((l: any) => l.amount < 0 || l.code === 'PF' || l.code === 'TAX'); // rudimentary

  const getCategory = (code: string) => {
    if (code === 'BASIC' || code === 'HRA') return 'EARNING';
    if (code === 'PF') return 'DEDUCTION';
    if (code === 'GROSS' || code === 'NET') return 'TOTAL';
    return 'OTHER';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>PeoplePay360</Text>
            <Text style={styles.docTitle}>CONFIDENTIAL SALARY PAYSLIP</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.periodText}>{payrun?.name || 'Pay Period'}</Text>
            <Text style={styles.statusBadge}>{payslip.status}</Text>
          </View>
        </View>

        {/* Metadata Grid */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Employee Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{employee.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Employee ID:</Text>
              <Text style={styles.value}>EMP-{employee.id.toString().padStart(4, '0')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Department:</Text>
              <Text style={styles.value}>{employee.department}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Position:</Text>
              <Text style={styles.value}>{employee.jobPosition}</Text>
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Contract Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Period Date:</Text>
              <Text style={styles.value}>
                {new Date(payrun.periodStart).toLocaleDateString()} - {new Date(payrun.periodEnd).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Bank Acct:</Text>
              <Text style={styles.value}>Verified</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Schedule:</Text>
              <Text style={styles.value}>{contract?.structure?.name || employee?.schedule?.name || 'Standard'}</Text>
            </View>
          </View>
        </View>

        {/* Itemized Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colRuleName}>Rule Name</Text>
            <Text style={styles.colCategory}>Category</Text>
            <Text style={styles.colCode}>Code</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          
          {lines.filter((l: any) => l.code !== 'NET' && l.code !== 'GROSS').map((line: any, i: number) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colRuleName}>{line.name || line.code}</Text>
              <Text style={styles.colCategory}>{getCategory(line.code)}</Text>
              <Text style={styles.colCode}>{line.code}</Text>
              <Text style={styles.colAmount}>{line.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Total Gross Salary:</Text>
            <Text>{payslip.gross.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Deductions:</Text>
            <Text>{(payslip.gross - payslip.net).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryNet}>
            <Text>Final Net Salary:</Text>
            <Text>{payslip.net.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleString()} by PeoplePay360. This is an auto-generated document and requires no signature.</Text>
          <Text>CONFIDENTIALITY NOTICE: This document contains private and confidential salary information.</Text>
        </View>
      </Page>
    </Document>
  );
};
