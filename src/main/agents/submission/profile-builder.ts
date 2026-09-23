import { Project, BusinessProfile, CreateBusinessProfile } from '../../../shared/types';

export class ProfileBuilderAgent {
  /**
   * Generates a comprehensive, normalized business profile package from project data
   */
  public buildProfilePackage(project: Project, existing?: Partial<BusinessProfile>): CreateBusinessProfile {
    const name = project.business_name || project.name || 'Company Name';
    const site = project.website_url || 'https://example.com';
    const desc = project.business_description || 'Professional solutions and services provider.';
    const industry = project.industry || 'Technology & Professional Services';

    // Normalize descriptions for diverse directory field constraints
    const shortDesc = desc.length > 150 ? desc.substring(0, 147) + '...' : desc;
    const longDesc = desc.length < 300 
      ? `${desc} Offering dedicated expertise in ${project.products_services || 'modern solutions'}, specialized for ${project.target_audience || 'industry clients'}. Founded with a commitment to quality and transparency.`
      : desc;

    let servicesArr: string[] = [];
    if (project.products_services) {
      servicesArr = project.products_services.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (servicesArr.length === 0) {
      servicesArr = ['Consulting', 'Digital Solutions', 'Support Services'];
    }

    let keywordsArr: string[] = [];
    if (project.keywords) {
      keywordsArr = project.keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    return {
      project_id: project.id,
      business_name: existing?.business_name || name,
      website_url: existing?.website_url || site,
      tag_line: existing?.tag_line || `Leading ${industry} Provider`,
      short_description: existing?.short_description || shortDesc,
      long_description: existing?.long_description || longDesc,
      industry: existing?.industry || industry,
      categories: existing?.categories || JSON.stringify([industry, 'Business & Professional Services']),
      services: existing?.services || JSON.stringify(servicesArr),
      products: existing?.products || JSON.stringify(servicesArr.slice(0, 3)),
      country: existing?.country || project.country || 'Global',
      city: existing?.city || '',
      state_region: existing?.state_region || '',
      postal_code: existing?.postal_code || '',
      address: existing?.address || '',
      phone: existing?.phone || '',
      public_email: existing?.public_email || 'contact@' + site.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0],
      founded_year: existing?.founded_year || new Date().getFullYear() - 3,
      business_hours: existing?.business_hours || 'Mon-Fri 09:00 - 18:00',
      logo_url: existing?.logo_url || null,
      images: existing?.images || JSON.stringify([]),
      social_profiles: existing?.social_profiles || JSON.stringify({
        linkedin: '',
        twitter: '',
        facebook: '',
        github: '',
        crunchbase: ''
      }),
      keywords: existing?.keywords || JSON.stringify(keywordsArr)
    };
  }
}
