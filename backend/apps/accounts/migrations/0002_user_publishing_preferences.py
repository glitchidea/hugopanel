from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='default_content_path',
            field=models.CharField(
                default='content/',
                help_text='Default Hugo content directory for newly connected repositories.',
                max_length=512,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='git_author_name',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Git commit author name. Empty uses server default from environment.',
                max_length=128,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='git_author_email',
            field=models.EmailField(
                blank=True,
                default='',
                help_text='Git commit author email. Empty uses server default from environment.',
                max_length=254,
            ),
        ),
    ]
