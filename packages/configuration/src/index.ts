export interface AppMetadata {
  name: string;
  service: string;
  version: string;
}

export function createAppMetadata(service: string): AppMetadata {
  return {
    name: 'X10Think Restaurant Management System',
    service,
    version: '0.1.0',
  };
}
