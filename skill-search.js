// Custom skill search implementation to prevent dropdown overlap issues

document.addEventListener('DOMContentLoaded', function() {
  const skillSearch = document.getElementById('skillSearch');
  const availabilityFilter = document.getElementById('availabilityFilter');
  
  if (!skillSearch) return;
  
  // Create a container for skill suggestions
  const skillSuggestions = document.createElement('div');
  skillSuggestions.id = 'skill-suggestions';
  skillSuggestions.style.position = 'absolute';
  skillSuggestions.style.width = '100%';
  skillSuggestions.style.background = 'rgba(60, 60, 80, 0.95)';
  skillSuggestions.style.borderRadius = '10px';
  skillSuggestions.style.zIndex = '10';
  skillSuggestions.style.maxHeight = '150px';
  skillSuggestions.style.overflowY = 'auto';
  skillSuggestions.style.display = 'none';
  skillSuggestions.style.marginTop = '5px';
  skillSuggestions.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
  skillSuggestions.style.backdropFilter = 'blur(10px)';
  
  // Append to the skill search form group
  skillSearch.parentNode.appendChild(skillSuggestions);
  
  // List of common skills for suggestions
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
    'PHP', 'Ruby', 'C++', 'C#', 'TypeScript', 'SQL', 'MongoDB', 'AWS',
    'Docker', 'Kubernetes', 'DevOps', 'Machine Learning', 'AI', 'Data Science',
    'UI/UX Design', 'Graphic Design', 'Project Management', 'Agile', 'Scrum'
  ];
  
  // Filter skills based on input
  function filterSkills(input) {
    if (!input) return [];
    input = input.toLowerCase();
    return commonSkills.filter(skill => 
      skill.toLowerCase().includes(input)
    );
  }
  
  // Show suggestions
  function showSuggestions(suggestions) {
    if (suggestions.length === 0) {
      skillSuggestions.style.display = 'none';
      return;
    }
    
    skillSuggestions.innerHTML = '';
    
    suggestions.forEach(skill => {
      const item = document.createElement('div');
      item.textContent = skill;
      item.style.padding = '8px 15px';
      item.style.cursor = 'pointer';
      item.style.color = '#fff';
      
      item.addEventListener('mouseover', () => {
        item.style.background = 'rgba(108, 99, 255, 0.5)';
      });
      
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
      });
      
      item.addEventListener('click', () => {
        skillSearch.value = skill;
        skillSuggestions.style.display = 'none';
      });
      
      skillSuggestions.appendChild(item);
    });
    
    skillSuggestions.style.display = 'block';
  }
  
  // Handle input changes
  skillSearch.addEventListener('input', () => {
    const value = skillSearch.value.trim();
    const suggestions = filterSkills(value);
    showSuggestions(suggestions);
  });
  
  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target !== skillSearch && e.target !== skillSuggestions) {
      skillSuggestions.style.display = 'none';
    }
  });
  
  // Handle focus on skill search
  skillSearch.addEventListener('focus', () => {
    const value = skillSearch.value.trim();
    const suggestions = filterSkills(value);
    showSuggestions(suggestions);
  });
  
  // Prevent default browser dropdown behavior
  skillSearch.setAttribute('autocomplete', 'off');
});
