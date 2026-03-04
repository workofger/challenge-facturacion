import React from 'react';
import { Mail, Phone, User } from 'lucide-react';
import { InputField } from '../common';
import { InvoiceData } from '../../types/invoice';

interface ContactSectionProps {
  formData: InvoiceData;
  onFieldChange: <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  formData,
  onFieldChange,
}) => {
  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="section-header">
        <span className="section-icon">
          <User size={18} />
        </span>
        <h3 className="section-title">Información de Contacto</h3>
      </div>

      {/* Contact Info Card */}
      <div className="card p-5 space-y-4">
        <p className="text-sm text-gray-500">
          Ingresa tus datos de contacto para recibir confirmación del procesamiento de tu factura.
        </p>
        
        {/* Email Field */}
        <InputField
          label="Correo Electrónico"
          type="email"
          placeholder="correo@ejemplo.com"
          value={formData.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
          icon={<Mail size={18} />}
        />

        {/* Phone Field */}
        <InputField
          label="Teléfono de Contacto"
          type="tel"
          placeholder="55 1234 5678"
          value={formData.phoneNumber}
          onChange={(e) => onFieldChange('phoneNumber', e.target.value)}
          icon={<Phone size={18} />}
        />

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 bg-tf-yellow/10 rounded-lg border border-tf-yellow/20">
          <div className="w-5 h-5 rounded-full bg-tf-yellow/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-tf-yellow-accent text-xs font-bold">i</span>
          </div>
          <p className="text-xs text-gray-600">
            Recibirás un correo de confirmación con el estatus de tu factura y detalles del pago programado.
          </p>
        </div>
      </div>
    </div>
  );
};
