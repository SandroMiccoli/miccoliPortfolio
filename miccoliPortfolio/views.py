from django.http import HttpResponse
from django.template import loader

from .models import Project, Image, Credit, Video

from .settings import MEDIA_URL


def index(request):
	template = loader.get_template('miccoliPortfolio/index.html')
	
	projects = Project.objects.filter(image__cover=True, front_page=True).values('title','slug','short_description','category','image__image').order_by('-date')

	# print(projects)

	context = {
		'projects': projects,
		'MEDIA_URL': MEDIA_URL,
		# 'lang': request.session['lang'] # TODO: Add session lang
		 'lang': 'en'
	}

	return HttpResponse(template.render(context, request))

def project_detail(request, title):
	template = loader.get_template('miccoliPortfolio/project-page.html')
	project = Project.objects.get(slug=title)
	images = Image.objects.all().filter(project_id=project.id)
	videos = Video.objects.all().filter(project_id=project.id)
	credits_titles = Credit.objects.all().filter(project_id=project.id).values_list(
		'title', flat=True).distinct().order_by('title')
	credits = Credit.objects.all().filter(project_id=project.id).order_by('title')
	year = project.date.year
	cover = Image.objects.get(project_id=project.id, cover=True)
	next_project =  Project.objects.get(id=get_next_id(project.id))

	print(next_project.slug)

	context = {
		'project': project,
		'MEDIA_URL': MEDIA_URL,
		'images': images,
		'videos': videos,
		'credits_titles': credits_titles,
		'credits': credits,
		'cover':cover,
		'next_project':next_project,
		'year': year
	}
	return HttpResponse(template.render(context, request))

def about(request):
	template = loader.get_template('miccoliPortfolio/about.html')
	context = {
	
	}
	return HttpResponse(template.render(context, request))


def switch_to_English_link(request):
    request.session['lang'] = 'en'
    return index(request)


def switch_to_Portuguese_link(request):
    request.session['lang'] = 'pt-br'
    return index(request)

def get_next_id(curr_id):
	try:
	    ret = Project.objects.filter(id__gt=curr_id).order_by("id")[0:1].get().id
	except Project.DoesNotExist:
	    ret = Project.objects.aggregate(Min("id"))['id__min']
	return ret